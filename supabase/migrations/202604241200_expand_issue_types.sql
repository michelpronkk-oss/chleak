-- Expand the issues.type check constraint to include all issue types
-- defined in the TypeScript domain model. The original constraint only
-- included the first five types from the initial schema. The activation,
-- signup, pricing, and upgrade types were missing and caused insert failures
-- when the URL-source path evaluation emitted findings for those families.

alter table public.issues
  drop constraint if exists issues_type_check;

alter table public.issues
  add constraint issues_type_check check (type in (
    'checkout_friction',
    'payment_method_coverage',
    'failed_payment_recovery',
    'signup_form_abandonment',
    'signup_identity_verification_dropoff',
    'activation_funnel_dropout',
    'upgrade_handoff_friction',
    'pricing_page_to_checkout_dropoff',
    'setup_gap',
    'fraud_false_decline'
  ));
