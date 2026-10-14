INSERT INTO assets(id,source,namespace,name,kind,description,owner,classification,purpose,retention_rule,security_evidence,review_due,last_reviewed,review_required) VALUES
('10000000-0000-0000-0000-000000000001','Demo ERP','sales','Customers','table','Customer account register','Aroha','personal','Service active accounts','','',current_date-10,current_date-100,true),
('10000000-0000-0000-0000-000000000002','Demo ERP','sales','Orders','table','Accepted customer orders','Wiremu','internal','','','',current_date+30,current_date-5,false),
('10000000-0000-0000-0000-000000000003','Demo BI','sales','Revenue dashboard','report','Monthly recognised revenue','Aroha','internal','','','',current_date-5,current_date-95,false),
('10000000-0000-0000-0000-000000000004','Demo Archive','legacy','Customers archive','file','Historic customer extract','','unknown','','','',NULL,NULL,true),
('10000000-0000-0000-0000-000000000005','Demo BI','ops','Fulfilment scorecard','report','Weekly order dispatch review','Maia','internal','','','',current_date+15,current_date-10,false)
ON CONFLICT DO NOTHING;
INSERT INTO fields(id,asset_id,name,data_type,description,classification) VALUES
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','customer_id','integer','Internal account identifier','internal'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','email','text','','personal'),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','net_amount','numeric','Value excluding tax','internal') ON CONFLICT DO NOTHING;
INSERT INTO terms(id,name,definition,owner) VALUES
('30000000-0000-0000-0000-000000000001','Net revenue','Recognised revenue excluding sales tax and returns.','Finance lead'),
('30000000-0000-0000-0000-000000000002','Active customer','An account with an accepted order in the previous year.','Sales lead') ON CONFLICT DO NOTHING;
INSERT INTO term_links(term_id,asset_id) VALUES ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
INSERT INTO lineage(upstream_id,downstream_id,evidence) VALUES
('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Synthetic mapping review'),
('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','Synthetic monthly report specification'),
('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000005','Synthetic dispatch mapping') ON CONFLICT DO NOTHING;
INSERT INTO issues(id,asset_id,title,owner,severity,due) VALUES
('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Missing email definition','Aroha','high',current_date-4),
('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','Confirm revenue exclusions','Wiremu','medium',current_date+2) ON CONFLICT DO NOTHING;
INSERT INTO quality_runs(id,asset_id,rule,checked_on,examined,failed,evidence,actor) VALUES
('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Email populated',current_date-2,400,17,'Synthetic quality sample','Demo operator'),
('50000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Positive order amount',current_date-1,800,0,'Synthetic quality sample','Demo operator') ON CONFLICT DO NOTHING;
