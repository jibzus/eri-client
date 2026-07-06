import { classifyFields, isBasicsField, isEvidenceField, WizardStep } from './wizard-steps';

const field = (over: Partial<any> = {}): any => ({
  key: over.key ?? Math.random().toString(36).slice(2),
  type: 'varchar',
  input: 'text',
  priority: 0,
  ...over,
});

const ids = (steps: WizardStep[]) => steps.map((s) => s.id);

describe('wizard-steps.classifyFields', () => {
  it('always appends a Review step and puts title/description in Basics', () => {
    const steps = classifyFields([
      field({ key: 'title', type: 'title', input: 'text' }),
      field({ key: 'desc', type: 'description', input: 'text' }),
    ]);
    expect(ids(steps)).toEqual(['basics', 'review']);
    expect(steps[0].fields.map((f) => f.key)).toEqual(['title', 'desc']);
  });

  it('drops empty buckets so step count adapts (Basics-only survey => 2 steps)', () => {
    const steps = classifyFields([
      field({ key: 'title', type: 'title', input: 'text' }),
      field({ key: 'loc', type: 'point', input: 'location' }),
      field({ key: 'cats', type: 'tags', input: 'tags' }),
    ]);
    expect(ids(steps)).toEqual(['basics', 'review']);
    expect(steps).toHaveLength(2);
  });

  it('routes custom fields to Details and media/video to Evidence', () => {
    const steps = classifyFields([
      field({ key: 'title', type: 'title', input: 'text' }),
      field({ key: 'party', type: 'varchar', input: 'select' }),
      field({ key: 'count', type: 'int', input: 'number' }),
      field({ key: 'photo', type: 'media', input: 'image' }),
      field({ key: 'clip', type: 'varchar', input: 'video' }),
    ]);
    expect(ids(steps)).toEqual(['basics', 'details', 'evidence', 'review']);
    expect(steps[1].fields.map((f) => f.key).sort()).toEqual(['count', 'party']);
    expect(steps[2].fields.map((f) => f.key).sort()).toEqual(['clip', 'photo']);
  });

  it('sorts fields within a step by priority', () => {
    const steps = classifyFields([
      field({ key: 'b', type: 'varchar', input: 'select', priority: 5 }),
      field({ key: 'a', type: 'varchar', input: 'select', priority: 1 }),
      field({ key: 'title', type: 'title', input: 'text' }),
    ]);
    const details = steps.find((s) => s.id === 'details')!;
    expect(details.fields.map((f) => f.key)).toEqual(['a', 'b']);
  });

  it('ignores fields without a key (system/placeholder rows)', () => {
    const steps = classifyFields([
      field({ key: 'title', type: 'title', input: 'text' }),
      { input: 'select', type: 'varchar' }, // no key
    ]);
    expect(steps.find((s) => s.id === 'details')).toBeUndefined();
  });

  it('tolerates null/empty input', () => {
    expect(ids(classifyFields([]))).toEqual(['review']);
    expect(ids(classifyFields(null as any))).toEqual(['review']);
  });
});

describe('wizard-steps predicates', () => {
  it('classifies basics fields', () => {
    expect(isBasicsField({ type: 'title' })).toBe(true);
    expect(isBasicsField({ type: 'description' })).toBe(true);
    expect(isBasicsField({ input: 'tags' })).toBe(true);
    expect(isBasicsField({ input: 'location' })).toBe(true);
    expect(isBasicsField({ input: 'select', type: 'varchar' })).toBe(false);
  });

  it('classifies evidence fields', () => {
    expect(isEvidenceField({ type: 'media' })).toBe(true);
    expect(isEvidenceField({ input: 'video' })).toBe(true);
    expect(isEvidenceField({ input: 'text', type: 'varchar' })).toBe(false);
  });
});
