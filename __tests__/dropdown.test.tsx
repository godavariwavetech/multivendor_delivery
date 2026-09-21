/**
 * The Dropdown's clear (×): shown only when a clearable field has a selection, and
 * pressing it empties the field without opening the list.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { Dropdown } from '../src/components';
import { ThemeProvider } from '../src/theme';

const OPTIONS = [
  { key: 1, label: 'Masala & spices' },
  { key: 2, label: 'Staples' },
];

async function render(props: Partial<React.ComponentProps<typeof Dropdown>>) {
  const onSelect = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <ThemeProvider role="vendor">
        <Dropdown label="Category" value={1} options={OPTIONS} onSelect={onSelect} {...props} />
      </ThemeProvider>,
    );
  });
  const clearButtons = () =>
    tree.root.findAll(n => n.props.accessibilityLabel === 'Clear Category' && typeof n.props.onPress === 'function');
  return { tree, onSelect, clearButtons };
}

describe('Dropdown clear (×)', () => {
  test('a clearable field with a selection shows the ×, and it empties the field', async () => {
    const { tree, onSelect, clearButtons } = await render({ clearable: true });
    expect(JSON.stringify(tree.toJSON())).toContain('Masala & spices');
    expect(clearButtons()).toHaveLength(1);
    await ReactTestRenderer.act(async () => clearButtons()[0].props.onPress());
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  test('the × does not open the list', async () => {
    const { tree, clearButtons } = await render({ clearable: true });
    await ReactTestRenderer.act(async () => clearButtons()[0].props.onPress());
    // Options only render while the list is open; the closed field shows just the selection.
    expect(JSON.stringify(tree.toJSON())).not.toContain('Staples');
  });

  test.each([
    ['not clearable', { clearable: false }],
    ['nothing selected', { clearable: true, value: null }],
    ['disabled', { clearable: true, disabled: true }],
  ] as const)('no × when %s', async (_, props) => {
    const { clearButtons } = await render(props);
    expect(clearButtons()).toHaveLength(0);
  });
});
