-- Drop old version safely
drop view if exists v_business_search cascade;

create view v_business_search as
select
  b.id,
  b.name,
  coalesce(b.category_primary, b.category_secondary) as category,
  b.category_primary,
  b.category_secondary,
  b.city,
  b.region,
  b.country,
  b.created_at,

  -- Ranking data
  r.trust_score,
  r.completeness_score,
  r.engagement_score,
  r.recency_score,
  r.intent_match_score,
  r.konect_rank,
  r.is_boosted,
  r.boost_multiplier

from businesses b
left join business_rank r
  on r.business_id = b.id
where b.is_active = true;