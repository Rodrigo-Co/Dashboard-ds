create database IF NOT EXISTS bancodashboard;
use bancodashboard;
-- drop database bancotb;
create table IF NOT EXISTS usuario(
idusuario int primary key auto_increment not null,
nome varchar(70) not null,
email varchar(70) not null,
senha varchar(70) not null DEFAULT 'GOOGLE_ACCOUNT',
pessoascasa int

);
alter table usuario modify column pessoascasa int;
select * from usuario;
drop table usuario;


