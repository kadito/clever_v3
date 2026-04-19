import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FileDisplay from './FileDisplay.vue';
import type { FileReference } from '@clever/shared';

const defaultProps = {
  contentType: 'installations-programming',
  contentUuid: 'uuid-123',
};

/**
 * MI-IT-23: Imagem apresentada como miniatura clicável
 * Validates: Requirements REQ-03
 */
describe('MI-IT-23: Image rendered as clickable thumbnail with correct src URL', () => {
  it('renders an img element with src pointing to the download endpoint', () => {
    const imageFile: FileReference = {
      key: 'files/installations-programming/uuid-123/abc123.jpg',
      name: 'foto-obra.jpg',
      mimeType: 'image/jpeg',
      size: 2_000_000,
    };

    const wrapper = mount(FileDisplay, {
      props: {
        ...defaultProps,
        files: [imageFile],
      },
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('/api/content/installations-programming/uuid-123/files/abc123.jpg');
    expect(img.attributes('alt')).toBe('foto-obra.jpg');

    // Image should be wrapped in a link that opens in new tab
    const link = wrapper.find('a[target="_blank"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('/api/content/installations-programming/uuid-123/files/abc123.jpg');
  });
});

/**
 * MI-IT-24: Documento apresentado como link de download
 * Validates: Requirements REQ-03
 */
describe('MI-IT-24: Document rendered as download link with name and size', () => {
  it('renders a download link with file name and formatted size', () => {
    const docFile: FileReference = {
      key: 'files/installations-programming/uuid-123/def456.pdf',
      name: 'relatorio.pdf',
      mimeType: 'application/pdf',
      size: 1_500_000,
    };

    const wrapper = mount(FileDisplay, {
      props: {
        ...defaultProps,
        files: [docFile],
      },
    });

    // Should not render an img for documents
    const imgs = wrapper.findAll('img');
    expect(imgs.length).toBe(0);

    // Should render a download link
    const link = wrapper.find('a[download="relatorio.pdf"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('/api/content/installations-programming/uuid-123/files/def456.pdf');

    // Should show file name and size
    const text = wrapper.text();
    expect(text).toContain('relatorio.pdf');
    expect(text).toContain('1.4 MB');
  });
});

/**
 * MI-IT-25: Lista vazia não renderiza nada
 * Validates: Requirements REQ-03
 */
describe('MI-IT-25: Empty files array renders nothing', () => {
  it('does not render any DOM when files is empty', () => {
    const wrapper = mount(FileDisplay, {
      props: {
        ...defaultProps,
        files: [],
      },
    });

    // Component should render nothing — the root div has v-if="files.length > 0"
    expect(wrapper.find('.file-display').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });
});
