-- This is an empty migration.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION strip_html_tags(html_text text)
RETURNS text AS $$
BEGIN
    RETURN regexp_replace(html_text, '<[^>]*>', ' ', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE notes ADD COLUMN content_search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', strip_html_tags(content))) STORED;

CREATE INDEX notes_ts_idx ON notes USING GIN (content_search_vector gin_trgm_ops);
CREATE INDEX notes_trigram_idx ON notes using GIN (strip_html_tags(content) gin_trgm_ops)

-- Add a function for searching notes by their content
CREATE OR REPLACE FUNCTION search_notes(search_term text, user_id text)
RETURNS TABLE(
	note_id text, 
	note_title text,
	notebook_title text,
	notebook_id text,
	ts_rank real, 
	trigram_similarity real
) AS $$
#variable_conflict use_variable
BEGIN
    RETURN QUERY
    SELECT 
        n.id AS note_id,
		n.title AS note_title,
		notebooks.title AS notebook_title,
		notebooks.id AS notebook_id,
        ts_rank(n.content_search_vector, to_tsquery('english', search_term || ':*')) AS ts_rank,
        similarity(strip_html_tags(n.content), search_term) AS trigram_similarity
    FROM 
		notes n INNER JOIN notebooks ON n.notebook_id = notebooks.id
		INNER JOIN users ON users.id = user_id
    WHERE 
		n.content_search_vector @@ to_tsquery('english', search_term || ':*')
       OR strip_html_tags(n.content) ILIKE '%' || search_term || '%'
    ORDER BY 
		ts_rank DESC,
		trigram_similarity DESC;
END;
$$ LANGUAGE plpgsql;