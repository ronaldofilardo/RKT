/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { NewAthleteModal } from '../components/NewAthleteModal';

describe('NewAthleteModal Characterization', () => {
  it('should render correctly with default state', () => {
    const { asFragment } = render(
      <NewAthleteModal isOpen={true} onClose={jest.fn()} onCreated={jest.fn()} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
