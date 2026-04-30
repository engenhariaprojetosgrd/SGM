-- ============================================================
-- SGMH – Seed: Dados de demonstração (frota MRN)
-- ============================================================

INSERT INTO hoses (id,equip,system,position,supplier,hose_type,part_number,unit_cost,install_date,install_hours,expected_life,notes,status) VALUES
('H001','MM8302','Sistema Hidráulico','Cil. Direção L/D','SOTREQ','Genuína (OEM)','CAT-7J8836',450,'2025-01-10',4820,2000,'Mangueira alta pressão genuína CAT','replaced'),
('H002','MM8302','Sistema Hidráulico','Cil. Lâmina L/E','TMH','Alternativa','TMH-8302-02',180,'2025-02-01',5100,1500,'','replaced'),
('H003','MM8202','Sistema de Direção','Cil. Direção L/E','TMH','Alternativa','TMH-8202-01',180,'2025-01-15',3200,1500,'','replaced'),
('H004','MM8202','Sistema Hidráulico','Cil. Implemento Dianteiro','SOTREQ','Genuína (OEM)','CAT-8202-04',380,'2025-03-10',3800,2000,'','replaced'),
('H005','MM8201','Sistema Hidráulico','Cil. Escarificador Traseiro','TMH','Alternativa','TMH-8201-05',210,'2025-03-01',6100,1500,'Terminal diferente do especificado','replaced'),
('H006','MM8301','Sistema Hidráulico','Cil. Direção L/D','SOTREQ','Genuína (OEM)','CAT-7J8836',450,'2025-04-20',2100,2000,'','active'),
('H007','MM8303','Sistema Hidráulico','Cil. Lâmina Niveladora','HC Hidráulica','Alternativa','HC-83-07',250,'2025-05-01',4500,1200,'','replaced'),
('H008','MM8302','Sistema Hidráulico','Cil. Implemento L/E','TMH','Alternativa','TMH-8302-08',190,'2025-06-01',6900,1500,'','replaced'),
('H009','MM8202','Sistema Hidráulico','Cil. Escarificador','SOTREQ','Genuína (OEM)','CAT-8202-09',520,'2025-06-15',4200,2000,'','active'),
('H010','MM8201','Sistema de Direção','Cil. Direção L/D','HC Hidráulica','Alternativa','HC-82-10',260,'2025-07-01',6600,1200,'','active'),
('H011','MM8303','Sistema Hidráulico','Cil. Nivelamento Vertical','TMH','Alternativa','TMH-8303-11',160,'2025-08-01',4900,1500,'Dimensão diferente do especificado','replaced'),
('H012','MM8302','Sistema de Direção','Cil. Direção R/D','TMH','Alternativa','TMH-8302-12',180,'2025-10-01',7850,1500,'','replaced'),
('H013','MM8301','Sistema Hidráulico','Cil. Lâmina Dianteiro','SOTREQ','Genuína (OEM)','CAT-8301-13',410,'2025-09-01',2400,2000,'','active'),
('H014','MM8201','Sistema Hidráulico','Cil. Implemento Traseiro','HC Hidráulica','Alternativa','HC-82-14',240,'2025-10-01',7100,1200,'','active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO failures (id,hose_id,equip,system,position,supplier_orig,fail_date,fail_hours,mtbf,fail_type,downtime,root_cause,new_supplier,new_cost,notes) VALUES
('F001','H001','MM8302','Sistema Hidráulico','Cil. Direção L/D','SOTREQ','2025-09-27',6820,2000,'Desgaste',3.26,'Desgaste natural','SOTREQ',450,'Substituição por desgaste natural ao final da vida útil'),
('F002','H002','MM8302','Sistema Hidráulico','Cil. Lâmina L/E','TMH','2025-03-05',5700,600,'Estouro',8.74,'Baixa qualidade do material','SOTREQ',450,'Mangueira estourou em plena operação. Equipamento parado 8.74h'),
('F003','H003','MM8202','Sistema de Direção','Cil. Direção L/E','TMH','2025-02-03',3650,450,'Estouro',11.14,'Baixa qualidade do material','TMH',180,'Estouro no cil. de direção. 1º pedido: 13 mangueiras erradas'),
('F004','H004','MM8202','Sistema Hidráulico','Cil. Implemento Dianteiro','SOTREQ','2025-08-15',5600,1800,'Vazamento',2.0,'Desgaste natural','SOTREQ',380,'Vazamento lento. Identificado em inspeção preventiva'),
('F005','H005','MM8201','Sistema Hidráulico','Cil. Escarificador Traseiro','TMH','2025-04-17',6420,320,'Estouro',1.69,'Montagem incorreta','SOTREQ',410,'Mangueira com terminal não compatível. Falha precoce'),
('F006','H007','MM8303','Sistema Hidráulico','Cil. Lâmina Niveladora','HC Hidráulica','2025-07-10',5300,800,'Estouro',4.0,'Abrasão por contato','HC Hidráulica',250,'Abrasão no ponto de passagem da mangueira'),
('F007','H008','MM8302','Sistema Hidráulico','Cil. Implemento L/E','TMH','2025-09-10',7800,900,'Vazamento',3.5,'Baixa qualidade do material','SOTREQ',450,'Vazamento no fitting. 2º pedido TMH: 11 de 11 erradas'),
('F008','H011','MM8303','Sistema Hidráulico','Cil. Nivelamento Vertical','TMH','2025-09-15',5300,400,'Estouro',5.2,'Baixa qualidade do material','SOTREQ',410,'Estouro precoce. Mangueira TMH com dimensão incorreta'),
('F009','H012','MM8302','Sistema de Direção','Cil. Direção R/D','TMH','2025-11-10',8450,600,'Estouro',3.9,'Baixa qualidade do material','SOTREQ',450,'3ª falha TMH no MM8302 em 11 meses')
ON CONFLICT (id) DO NOTHING;
