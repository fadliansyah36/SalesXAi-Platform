begin;
do $$
declare c record; cols text; idx text;
begin
 for c in
  select con.oid,con.conname,con.conrelid,con.conkey
  from pg_constraint con
  join pg_class rel on rel.oid=con.conrelid
  join pg_namespace n on n.oid=rel.relnamespace
  where con.contype='f' and n.nspname='public' and rel.relname like 'reward_%'
 loop
  select string_agg(format('%I',a.attname),',' order by k.ord)
   into cols
   from unnest(c.conkey) with ordinality k(attnum,ord)
   join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum;
  idx:='reward_fk_'||substr(md5(c.conname),1,12);
  execute format('create index if not exists %I on %s (%s)',idx,c.conrelid::regclass,cols);
 end loop;
end $$;
commit;