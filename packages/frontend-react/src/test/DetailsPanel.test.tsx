import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailsPanel } from '../components/DetailsPanel';
import React from 'react';

describe('DetailsPanel', () => {
  it('renders node details and handles backlink clicks', () => {
    const handleOpenNode = vi.fn();
    const mockSelectedNode = {
      id: 'node1',
      title: 'Node 1 Title',
      body: <div>Node 1 Body</div>,
      backlinks: [{ source: 'node2', title: 'Node 2 Title' }],
    };

    render(
      <DetailsPanel
        open={true}
        selected={mockSelectedNode}
        theme="dark"
        onClose={() => {}}
        onOpenNode={handleOpenNode}
      />
    );

    expect(screen.getByText('Node 1 Title')).toBeInTheDocument();
    expect(screen.getByText('Backlinks')).toBeInTheDocument();

    const backlinkButton = screen.getByText('Node 2 Title');
    fireEvent.click(backlinkButton);
    expect(handleOpenNode).toHaveBeenCalledWith('node2');
  });
});
