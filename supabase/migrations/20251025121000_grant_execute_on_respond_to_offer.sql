-- Ensure RPC is callable via PostgREST by authenticated users (and anon if needed)

DO $$
BEGIN
  -- Grant EXECUTE on the function to roles used by the API
  GRANT EXECUTE ON FUNCTION respond_to_offer(uuid, text) TO authenticated;
  GRANT EXECUTE ON FUNCTION respond_to_offer(uuid, text) TO anon;
EXCEPTION WHEN undefined_function THEN
  -- Function may not exist yet if migrations run out of order; ignore here.
  RAISE NOTICE 'respond_to_offer(uuid, text) not found yet; run again after function creation.';
END $$;


