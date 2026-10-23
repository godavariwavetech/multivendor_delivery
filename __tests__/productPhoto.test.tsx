/* eslint-env jest */
// VA-001: with live data a dish shows the photo the server holds for it, or a placeholder. The bundled artwork
// belongs to the demo menu only, and a name match must never put another dish's picture on it.

import type { Product } from '../src/domain/types';

type Shown = { remote: string[]; builtIn: number; placeholders: number };

/** Renders ProductPhoto in a fresh module registry so USE_MOCK_DATA can differ per test. */
function show(mock: boolean, product: Partial<Product> & { name: string }, interact?: (root: any, act: any) => void): Shown {
  let shown!: Shown;
  jest.isolateModules(() => {
    jest.doMock('@config/constants', () => ({ ...jest.requireActual('@config/constants'), USE_MOCK_DATA: mock }));
    const React = require('react');
    const TestRenderer = require('react-test-renderer');
    const { ProductPhoto } = require('../src/features/vendor/menu/ProductPhoto');
    const subject = { id: 'x1', category: 'food', image: null, ...product } as Product;
    let tree: any;
    TestRenderer.act(() => {
      tree = TestRenderer.create(React.createElement(ProductPhoto, { product: subject, size: 56 }));
    });
    if (interact) {
      interact(tree.root, TestRenderer.act);
    }
    const withSource = tree.root.findAll((n: any) => String(n.type) === 'Image' && n.props.source !== undefined);
    shown = {
      remote: withSource.map((n: any) => n.props.source.uri).filter(Boolean),
      builtIn: withSource.filter((n: any) => !n.props.source.uri).length,
      placeholders: tree.root.findAll((n: any) => String(n.type) === 'View' && n.props.testID === 'product-photo-placeholder').length,
    };
  });
  return shown;
}

describe('live data (USE_MOCK_DATA = false)', () => {
  test('a dish with a server photo shows that photo', () => {
    const shown = show(false, { name: 'Kaju Panna curry', image: '/uploads/partner_app/kaju.jpg' });
    expect(shown.remote).toHaveLength(1);
    expect(shown.remote[0]).toMatch(/\/uploads\/partner_app\/kaju\.jpg$/);
    expect(shown.builtIn).toBe(0);
    expect(shown.placeholders).toBe(0);
  });

  test('a full URL from the server is used as it is', () => {
    const shown = show(false, { name: 'Kaju Panna curry', image: 'https://ekart360.in/upload_files/kaju.jpg' });
    expect(shown.remote).toEqual(['https://ekart360.in/upload_files/kaju.jpg']);
  });

  test('a relative path with no leading slash still points at the server', () => {
    const shown = show(false, { name: 'Mutton Biryani', image: 'partner_app/productimage/3?v=abc' });
    expect(shown.remote).toHaveLength(1);
    expect(shown.remote[0]).toMatch(/^https?:\/\/[^/]+(:\d+)?\/partner_app\/productimage\/3\?v=abc$/);
  });

  test.each([
    ['Veg Fried Rice', 'food'],
    ['Paneer Butter Masala', 'food'],
    ['Kalakand', 'food'],
    ['Rasmalai', 'food'],
    ['Chicken Fried Rice', 'food'],
    ['Ponni Raw Rice', 'grocery'],
    ['Tomato', 'produce'],
    ['Butterscotch Cake', 'bakery'],
    ['Chicken Curry Cut', 'meat'],
  ])('%s with no server photo shows the placeholder, never artwork picked by its name', (name, category) => {
    const shown = show(false, { name, category: category as Product['category'], image: null });
    expect(shown.placeholders).toBe(1);
    expect(shown.builtIn).toBe(0);
    expect(shown.remote).toEqual([]);
  });

  test('a photo that fails to load falls back to the placeholder, not to artwork', () => {
    const shown = show(false, { name: 'Veg Fried Rice', image: '/uploads/partner_app/gone.jpg' }, (root, act) => {
      const image = root.findAll((n: any) => String(n.type) === 'Image' && n.props.source?.uri)[0];
      act(() => image.props.onError());
    });
    expect(shown.remote).toEqual([]);
    expect(shown.builtIn).toBe(0);
    expect(shown.placeholders).toBe(1);
  });
});

describe('demo data (USE_MOCK_DATA = true)', () => {
  test('Veg Fried Rice does not get the chicken fried rice picture', () => {
    const shown = show(true, { name: 'Veg Fried Rice' });
    expect(shown.builtIn).toBe(0);
  });

  test('Chicken Fried Rice keeps its own bundled picture', () => {
    const shown = show(true, { name: 'Chicken Fried Rice' });
    expect(shown.builtIn).toBe(1);
  });

  test('a demo dish still uses the bundled artwork', () => {
    const shown = show(true, { name: 'Paneer Butter Masala' });
    expect(shown.builtIn).toBe(1);
  });
});
