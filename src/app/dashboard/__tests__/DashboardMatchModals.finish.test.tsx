/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardMatchModals } from '../components/DashboardMatchModals';

describe('DashboardMatchModals (Finish Match)', () => {
  const defaultProps = {
    matchToDelete: null,
    onCancelDelete: jest.fn(),
    onConfirmDelete: jest.fn(),
    serverMatch: null,
    startingMatch: false,
    onSelectServer: jest.fn(),
    onCloseServer: jest.fn(),
    setSummaryMatch: null,
    setSummaryTimelinePoints: [],
    completedSetsCount: 0,
    completedSetsData: [],
    onCloseSetSummary: jest.fn(),
    onResumeSetSummary: jest.fn(),
    editMatch: null,
    onCloseEditInfo: jest.fn(),
    onSuccessEditInfo: jest.fn(),
  };

  it('renderiza o CommentModal com o título de encerramento quando matchToFinish for fornecido', () => {
    const matchToFinish = {
      id: 'match-xyz',
      scoreState: {},
    };

    render(
      <DashboardMatchModals
        {...defaultProps}
        matchToFinish={matchToFinish}
        onCancelFinish={jest.fn()}
        onConfirmFinish={jest.fn()}
      />
    );

    expect(screen.getByText('Encerrar Partida - Comentário Final')).toBeInTheDocument();
  });
});
