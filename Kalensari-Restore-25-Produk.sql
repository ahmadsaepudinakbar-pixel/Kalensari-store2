-- KALENSARI STORE - RESTORE 25 PRODUK BAWAAN
-- Jalankan seluruh script ini di Supabase > SQL Editor.

begin;

delete from public.products;

insert into public.products (id,name,price,sale,category,unit,seller,status,image) values
(1,'Lotek Bongko',12000,8000,'Makanan','1 porsi','Teh Ida','Show','https://cdn.store.link/products/kalensaristore80353/o-fvve-chatgpt%20image%20sep%2028%2C%202026%2C%2005_14_09%20am.png?versionId=sSlnWC5X3v6SfdE8SJ7kfFpkAAtYEG66'),
(2,'Bakso Sapi Biasa',10000,null,'Makanan','1 porsi','Zyan Bakso','Show','https://cdn.store.link/products/kalensaristore80353/pf0do4-chatgpt%20image%20sep%2028%2C%202026%2C%2006_23_05%20am.png?versionId=LvDf81yvhC2OIgUPloRKlaBbRFi.9BuH'),
(3,'MIe ayam Pedas',10000,null,'Makanan','1 porsi','H. Diman, Mang Edo, Mang Tardug','Show','https://cdn.store.link/products/kalensaristore80353/0qg0at-chatgpt%20image%20sep%2028%2C%202026%2C%2002_03_31%20pm.png?versionId=EH1aAjwRvQd3dMY93ItbAgINe5lzjnTw'),
(4,'MIe ayam Biasa',10000,null,'Makanan','1 porsi','H. Diman, Mang Edo, Mang Tardug','Show','https://cdn.store.link/products/kalensaristore80353/m5q9je-chatgpt%20image%20sep%2028%2C%202026%2C%2002_02_42%20pm.png?versionId=Lci_mH9SOmBpD2nCjBV_Z_o_XXpxpW8v'),
(5,'Bakso Tulang',25000,18000,'Makanan','1 porsi','Zyan Bakso','Out of Stock','https://cdn.store.link/products/kalensaristore80353/agx1iw-chatgpt%20image%20sep%2028%2C%202026%2C%2006_29_33%20am.png?versionId=1n1pJ2ilQgM4jrhR5X_0LEG9mB.lTmg8'),
(6,'Bakso Telur',12000,10000,'Makanan','1 porsi','Zyan Bakso','Show','https://cdn.store.link/products/kalensaristore80353/8a69b3-chatgpt%20image%20sep%2028%2C%202026%2C%2006_34_03%20am.png?versionId=m_nc2BhsK7d4LdKAPdxnMAiRHAV.Q2qB'),
(7,'Bakso Urat',18000,15000,'Makanan','1 porsi','Zyan Bakso','Show','https://cdn.store.link/products/kalensaristore80353/obbajp-chatgpt%20image%20sep%2028%2C%202026%2C%2006_36_33%20am.png?versionId=h_Evc0EcQtdz4PFbFk8aZey0jgRRXZ.p'),
(8,'Jus Alpukat',10000,null,'Minuman','1 cup besar','Teh Liya','Show','https://cdn.store.link/products/kalensaristore80353/3x8j0a-chatgpt%20image%20sep%2028%2C%202026%2C%2006_52_41%20am.png?versionId=eKLzC7y3fgCWrkTSAdcaLHEyEYAdZMsh'),
(9,'Jus Buah Naga',10000,null,'Minuman','1 cup besar','Teh Liya','Show','https://cdn.store.link/products/kalensaristore80353/p8vus5-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_02%20am.png?versionId=e6H7dwvYmMOZrI86QKN98dyVxHcc8V0M'),
(10,'Jus Tomat',10000,null,'Minuman','1 cup besar','Teh Liya','Show','https://cdn.store.link/products/kalensaristore80353/o4d1bt-chatgpt%20image%20sep%2028%2C%202026%2C%2007_20_47%20am.png?versionId=IbXRZdg2vp6bCuXJPch5YT7FgQZXXcRM'),
(11,'Jus Mangga',10000,null,'Minuman','1 cup besar','Teh Liya','Show','https://cdn.store.link/products/kalensaristore80353/lqk2sp-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_59%20am.png?versionId=FADsI7qbgepPpQt7XVGl901Q_3cKHFQW'),
(12,'Es teh Manis',3000,null,'Minuman','1 cup besar','Tea DESA','Show','https://cdn.store.link/products/kalensaristore80353/abqncl-hops-3260267377.webp?versionId=P4DG3eGis6QyEzh9ZFQm3CBF8p9DEJwx'),
(13,'Es teh Matcha Late',6000,null,'Minuman','1 cup besar Rasa Greentea','Tea DESA','Show','https://cdn.store.link/products/kalensaristore80353/c9c6rx-images%20%281%29.jpg?versionId=K0P2vQjt8SpfWctljxkmCkUO_8AfkYf2'),
(14,'Es teh Matcha Premium',15000,12000,'Minuman','1 cup besar Rasa Greentea','Tea DESA','Show','https://cdn.store.link/products/kalensaristore80353/bkv3a5-images.jpg?versionId=jKTeHTYDtwRD2qs6CWqYs9ZM2EBZ9emC'),
(15,'Nasi Kebuli',25000,20000,'Makanan','1 porsi','Teh iyoh','Show','https://cdn.store.link/products/kalensaristore80353/u4fafx-chatgpt%20image%20sep%2028%2C%202026%2C%2002_14_04%20pm.png?versionId=DHZD_c9LScH15.An7XpzcTJMrjDf0AJk'),
(16,'Nasi Goreng',13000,null,'Makanan','1 porsi','Kang Diki Sueb','Show','https://cdn.store.link/products/kalensaristore80353/h38vn8-chatgpt%20image%20sep%2028%2C%202026%2C%2002_11_47%20pm.png?versionId=Q1UfoJozDqlb8kaNfjJqp6nKv74i_B3F'),
(17,'Pecel Lele',15000,null,'Makanan','Pecel Lele','Mang Tardug','Show','https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE'),
(18,'Pecel Lele + Nasi',20000,null,'Makanan','Pecel Lele + Nasi','Mang Tardug','Show','https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE'),
(19,'Pecel Ayam',20000,null,'Makanan','Pecel Ayam','Mang Tardug','Show','https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx'),
(20,'Pecel Ayam + Nasi',25000,null,'Makanan','Pecel Ayam + Nasi','Mang Tardug','Show','https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx'),
(21,'Fried Chiken',10000,null,'Makanan','Ayam Goreng Tepung','Warga Kalensari','Show','https://cdn.store.link/products/kalensaristore80353/q38c2x-chatgpt%20image%20sep%2028%2C%202026%2C%2002_23_43%20pm.png?versionId=RR2yA7Iutiz2jXiFwJNUzApiqzE7ItsL'),
(22,'Soto Ayam',20000,null,'Makanan','1 porsi','Sate Madura','Show','https://cdn.store.link/products/kalensaristore80353/4io072-chatgpt%20image%20sep%2028%2C%202026%2C%2002_22_28%20pm.png?versionId=48IdG9bl9fPErJcNUzMeAPrvhzOOe_qr'),
(23,'Sate Ayam',20000,null,'Makanan','1 porsi','Sate Madura','Show','https://cdn.store.link/products/kalensaristore80353/ewpn71-chatgpt%20image%20sep%2028%2C%202026%2C%2002_18_51%20pm.png?versionId=X09ZJ.tPJyqr_LhYnZRngTpDFKIVqz0b'),
(24,'Nasi Ayam Katsu',20000,null,'Makanan','1 porsi','Teh Iyoh','Show','https://cdn.store.link/products/kalensaristore80353/ievcoz-chatgpt%20image%20sep%2028%2C%202026%2C%2002_17_10%20pm.png?versionId=buhfyErVz0r0y_eaESh2AooKeylFdopS'),
(25,'Spageti',10000,null,'Makanan','1 porsi','Teh Iyoh','Show','https://cdn.store.link/products/kalensaristore80353/d62zqy-aa1408ce-c67d-4d63-aa67-12ec89b3c905.png?versionId=chUteSwuPamgkCgB_ORU_hnugVoqj8dW');

commit;

select count(*) as jumlah_produk from public.products;
select id,name,status from public.products order by id;
