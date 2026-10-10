/* =====================================================================
   Kalensari Store • QRIS statis -> QRIS dengan nominal terisi otomatis
   Dipakai oleh index (pembeli) dan admin (cek & uji coba).

   Cara kerja: QRIS statis hanyalah teks standar EMV (diawali 000201).
   Untuk pesanan, tanda "statis" (tag 01 = 11) diganti "dinamis" (12),
   nominal disisipkan sebagai tag 54, lalu kode pengaman CRC16 dihitung ulang.
   Semua dikerjakan di perangkat; tidak ada data yang dikirim ke server.
   ===================================================================== */
(function(root){
  "use strict";
  // CRC16-CCITT (poly 0x1021, awal 0xFFFF) sesuai standar QRIS/EMV
  function crc16(s){
    var c=0xFFFF,i,k;
    for(i=0;i<s.length;i++){
      c^=(s.charCodeAt(i)&0xFF)<<8;
      for(k=0;k<8;k++)c=(c&0x8000)?(((c<<1)^0x1021)&0xFFFF):((c<<1)&0xFFFF);
    }
    return c.toString(16).toUpperCase().padStart(4,"0");
  }
  // hanya buang baris baru/tab & spasi di ujung; spasi DI DALAM (mis. nama toko) harus tetap
  function bersihkan(raw){return String(raw==null?"":raw).replace(/[\r\n\t]+/g,"").trim();}
  // Pecah teks menjadi daftar {tag, val}; null jika formatnya rusak
  function parse(s){
    var out=[],i=0,tag,ln,v;
    while(i<s.length){
      if(i+4>s.length)return null;
      tag=s.substr(i,2);ln=s.substr(i+2,2);
      if(!/^\d{2}$/.test(tag)||!/^\d{2}$/.test(ln))return null;
      ln=parseInt(ln,10);v=s.substr(i+4,ln);
      if(v.length!==ln)return null;
      out.push({tag:tag,val:v});i+=4+ln;
    }
    return out;
  }
  function tlv(tag,val){return tag+String(val.length).padStart(2,"0")+val;}
  function ambil(list,tag){for(var i=0;i<list.length;i++)if(list[i].tag===tag)return list[i].val;return "";}

  // Periksa teks QRIS. Hasil: {ok, pesan, nama, kota, nmid, jenis}
  function cek(raw){
    var s=bersihkan(raw),r={ok:false,pesan:"",nama:"",kota:"",nmid:"",jenis:""};
    if(!s){r.pesan="Teks QRIS masih kosong.";return r;}
    if(s.indexOf("000201")!==0){r.pesan="Bukan teks QRIS (harus diawali 000201). Pastikan yang ditempel isi QR-nya, bukan alamat gambar.";return r;}
    var list=parse(s);
    if(!list){r.pesan="Format teks QRIS rusak / terpotong. Salin ulang dari awal sampai akhir.";return r;}
    var last=list[list.length-1];
    if(!last||last.tag!=="63"||last.val.length!==4){r.pesan="Bagian akhir (CRC) tidak ditemukan. Teks mungkin terpotong.";return r;}
    if(crc16(s.slice(0,-4))!==last.val.toUpperCase()){r.pesan="Kode pengaman (CRC) tidak cocok. Teks QRIS salah salin atau sudah diubah.";return r;}
    var ada=list.some(function(x){var n=parseInt(x.tag,10);return n>=26&&n<=51;});
    if(!ada){r.pesan="Data merchant (tag 26–51) tidak ditemukan.";return r;}
    r.nama=ambil(list,"59");r.kota=ambil(list,"60");
    var acc=list.filter(function(x){var n=parseInt(x.tag,10);return n>=26&&n<=51;});
    for(var i=0;i<acc.length;i++){var sub=parse(acc[i].val);if(sub){var id=ambil(sub,"02");if(/^ID\d{10,}/.test(id)||(id&&!r.nmid))r.nmid=id;}}
    var j=ambil(list,"01");r.jenis=j==="11"?"statis":j==="12"?"dinamis":j;
    if(j==="12"&&ambil(list,"54")){r.pesan="QRIS ini sudah berisi nominal tertentu. Pakai QRIS STATIS (tanpa nominal) dari merchant Anda.";return r;}
    r.ok=true;r.pesan="QRIS valid"+(r.nama?" • "+r.nama:"")+(r.kota?" ("+r.kota+")":"");
    return r;
  }
  // Buat teks QRIS dengan nominal. nominal kosong/0 -> kembalikan QRIS statis apa adanya.
  function buat(raw,nominal){
    var s=bersihkan(raw),c=cek(s);
    if(!c.ok)throw new Error(c.pesan);
    var n=Math.round(Number(nominal)||0);
    if(!(n>0))return s;
    if(n>999999999)throw new Error("Nominal terlalu besar");
    var list=parse(s).filter(function(x){var t=parseInt(x.tag,10);return t!==54&&t!==55&&t!==56&&t!==57&&t!==63;});
    var out="",pasang=false;
    list.forEach(function(x){
      var t=parseInt(x.tag,10);
      if(!pasang&&t>54){out+=tlv("54",String(n));pasang=true;}
      out+=tlv(x.tag,x.tag==="01"?"12":x.val);
    });
    if(!pasang)out+=tlv("54",String(n));
    out+="6304";
    return out+crc16(out);
  }
  var api={crc16:crc16,bersihkan:bersihkan,parse:parse,cek:cek,buat:buat};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.QRISStatis=api;
})(typeof window!=="undefined"?window:globalThis);
