// Feature: dictation-voices-accounts, Property 4: Shared list card rendering completeness
import React from 'react';
import { render } from '@testing-library/react-native';
import fc from 'fast-check';
import SharedListCard from '../SharedListCard';
import { SharedListSummary } from '../../types';

/**
 * Property 4: Shared list card rendering completeness
 *
 * For any SharedListSummary object with non-empty name, positive word count,
 * and non-empty creator display name, the rendered SharedListCard output SHALL
 * contain the list name, word count, and creator display name.
 *
 * Validates: Requirements 4.2
 */
describe('SharedListCard property tests', () => {
  const sharedListSummaryArb = fc.record({
    name: fc.string({ minLength: 1 }),
    wordCount: fc.nat({ min: 1 }),
    creatorDisplayName: fc.string({ minLength: 1 }),
  });

  it('rendered output contains list name, word count, and creator display name for any valid SharedListSummary', () => {
    fc.assert(
      fc.property(sharedListSummaryArb, ({ name, wordCount, creatorDisplayName }) => {
        const list: SharedListSummary = {
          id: 'test-list-id',
          name,
          wordCount,
          creatorDisplayName,
          createdAt: '2024-01-01T00:00:00Z',
        };

        const { getByTestId } = render(
          <SharedListCard list={list} onPress={() => {}} />
        );

        // Verify list name is rendered
        const nameEl = getByTestId('shared-list-card-name');
        const nameChildren = nameEl.props.children;
        const nameText = Array.isArray(nameChildren) ? nameChildren.join('') : String(nameChildren);
        expect(nameText).toContain(name);

        // Verify word count is rendered
        const countEl = getByTestId('shared-list-card-word-count');
        const countChildren = countEl.props.children;
        const countText = Array.isArray(countChildren) ? countChildren.join('') : String(countChildren);
        expect(countText).toContain(String(wordCount));

        // Verify creator display name is rendered
        const creatorEl = getByTestId('shared-list-card-creator');
        const creatorChildren = creatorEl.props.children;
        const creatorText = Array.isArray(creatorChildren) ? creatorChildren.join('') : String(creatorChildren);
        expect(creatorText).toContain(creatorDisplayName);
      }),
      { numRuns: 100 }
    );
  });
});
