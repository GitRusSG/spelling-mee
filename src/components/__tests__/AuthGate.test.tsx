import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import AuthGate from '../AuthGate';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock useAuth
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { uid: 'user-1' },
    });

    const { getByText } = render(
      <AuthGate>
        <Text>Protected Content</Text>
      </AuthGate>
    );

    expect(getByText('Protected Content')).toBeTruthy();
  });

  it('renders default login prompt when user is not authenticated and no fallback provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    const { getByTestId, getByText } = render(
      <AuthGate>
        <Text>Protected Content</Text>
      </AuthGate>
    );

    expect(getByTestId('auth-gate-login-prompt')).toBeTruthy();
    expect(getByText('Please log in to access this feature')).toBeTruthy();
    expect(getByTestId('auth-gate-login-button')).toBeTruthy();
  });

  it('renders custom fallback when user is not authenticated and fallback is provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    const { getByText, queryByTestId } = render(
      <AuthGate fallback={<Text>Custom Login Prompt</Text>}>
        <Text>Protected Content</Text>
      </AuthGate>
    );

    expect(getByText('Custom Login Prompt')).toBeTruthy();
    expect(queryByTestId('auth-gate-login-prompt')).toBeNull();
  });

  it('does not render children when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    const { queryByText } = render(
      <AuthGate>
        <Text>Protected Content</Text>
      </AuthGate>
    );

    expect(queryByText('Protected Content')).toBeNull();
  });

  it('renders loading indicator while auth state is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    const { getByTestId, queryByText } = render(
      <AuthGate>
        <Text>Protected Content</Text>
      </AuthGate>
    );

    expect(getByTestId('auth-gate-loading')).toBeTruthy();
    expect(queryByText('Protected Content')).toBeNull();
  });

  it('navigates to login screen when Sign In button is pressed', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    const { getByTestId } = render(
      <AuthGate>
        <Text>Protected Content</Text>
      </AuthGate>
    );

    fireEvent.press(getByTestId('auth-gate-login-button'));
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('navigates to register screen when Sign Up link is pressed', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    const { getByTestId } = render(
      <AuthGate>
        <Text>Protected Content</Text>
      </AuthGate>
    );

    fireEvent.press(getByTestId('auth-gate-register-link'));
    expect(mockPush).toHaveBeenCalledWith('/auth/register');
  });
});
