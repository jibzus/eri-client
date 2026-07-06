/**
 * Pure, dependency-free logic for the Eri submission wizard.
 *
 * Extracted from PostEditComponent so the step-grouping algorithm can be unit
 * tested in isolation (the component itself has ~17 injected dependencies and
 * cannot be instantiated in a plain unit test). Nothing here imports Angular.
 */

export type WizardStepId = 'basics' | 'details' | 'evidence' | 'review';

export interface WizardStep {
  id: WizardStepId;
  label: string;
  fields: any[];
}

/** Title, description, category (tags) and location are the "what & where". */
export function isBasicsField(f: any): boolean {
  return (
    f?.type === 'title' ||
    f?.type === 'description' ||
    f?.input === 'tags' ||
    f?.input === 'location'
  );
}

/** Photos, audio, documents and embedded video are supporting evidence. */
export function isEvidenceField(f: any): boolean {
  return f?.type === 'media' || f?.input === 'video';
}

const byPriority = (a: any, b: any) => (a?.priority || 0) - (b?.priority || 0);

/**
 * Group a flat list of survey fields into ordered wizard steps.
 * Empty buckets are dropped, so the step count adapts to the survey; a Review
 * step is always appended last. A survey always has a title field, so the
 * result is never just `[review]`.
 */
export function classifyFields(allFields: any[]): WizardStep[] {
  const fields = (allFields || []).filter((f) => f && f.key);
  const basics = fields.filter(isBasicsField).sort(byPriority);
  const evidence = fields.filter(isEvidenceField).sort(byPriority);
  const details = fields
    .filter((f) => !isBasicsField(f) && !isEvidenceField(f))
    .sort(byPriority);

  const steps: WizardStep[] = [];
  if (basics.length) steps.push({ id: 'basics', label: 'Basics', fields: basics });
  if (details.length) steps.push({ id: 'details', label: 'Details', fields: details });
  if (evidence.length) steps.push({ id: 'evidence', label: 'Evidence', fields: evidence });
  steps.push({ id: 'review', label: 'Review', fields: [] });
  return steps;
}
