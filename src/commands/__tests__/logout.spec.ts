import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logout } from '../logout';
import { runCommand } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);

describe('logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runCommand with correct arguments', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Logout successful',
      stderr: '',
      exitCode: 0
    });

    await logout('registry.example.com');

    expect(mockRunCommand).toHaveBeenCalledWith('logout', ['registry.example.com']);
  });

  it('should handle successful logout', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Removing login credentials for registry.example.com',
      stderr: '',
      exitCode: 0
    });

    await expect(logout('registry.example.com')).resolves.not.toThrow();
  });

  it('should propagate errors from runCommand', async () => {
    const errorMessage = 'Kit command failed with exit code 1: registry not found';
    mockRunCommand.mockRejectedValue(new Error(errorMessage));

    await expect(logout('nonexistent.registry.com'))
      .rejects.toThrow(errorMessage);
  });

  it('should handle empty registry parameter', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0
    });

    await logout('');

    expect(mockRunCommand).toHaveBeenCalledWith('logout', ['']);
  });

  it('should handle different registry formats', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Logout successful',
      stderr: '',
      exitCode: 0
    });

    const registries = [
      'localhost:5000',
      'https://registry.example.com',
      'registry.example.com:8080',
      'gcr.io',
      'hub.docker.com',
    ];

    for (const registry of registries) {
      await logout(registry);
      expect(mockRunCommand).toHaveBeenCalledWith('logout', [registry]);
    }

    expect(mockRunCommand).toHaveBeenCalledTimes(registries.length);
  });

  it('should handle logout when not logged in', async () => {
    const notLoggedInError = 'Kit command failed with exit code 1: not logged in to registry.example.com';
    mockRunCommand.mockRejectedValue(new Error(notLoggedInError));

    await expect(logout('registry.example.com'))
      .rejects.toThrow('Kit command failed with exit code 1: not logged in to registry.example.com');
  });

  it('should handle network errors during logout', async () => {
    const networkError = 'Failed to execute kit command: connect ECONNREFUSED';
    mockRunCommand.mockRejectedValue(new Error(networkError));

    await expect(logout('unreachable.registry.com'))
      .rejects.toThrow('Failed to execute kit command: connect ECONNREFUSED');
  });

  it('should handle registry with special characters in URL', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Logout successful',
      stderr: '',
      exitCode: 0
    });

    const specialRegistry = 'my-registry.example-domain.com:8080/v2';

    await logout(specialRegistry);

    expect(mockRunCommand).toHaveBeenCalledWith('logout', [specialRegistry]);
  });

  it('should handle multiple sequential logouts', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Logout successful',
      stderr: '',
      exitCode: 0
    });

    await logout('registry1.example.com');
    await logout('registry2.example.com');
    await logout('registry3.example.com');

    expect(mockRunCommand).toHaveBeenCalledTimes(3);
    expect(mockRunCommand).toHaveBeenNthCalledWith(1, 'logout', ['registry1.example.com']);
    expect(mockRunCommand).toHaveBeenNthCalledWith(2, 'logout', ['registry2.example.com']);
    expect(mockRunCommand).toHaveBeenNthCalledWith(3, 'logout', ['registry3.example.com']);
  });

  it('should handle logout command execution failure', async () => {
    const execError = 'Failed to execute kit command: command not found';
    mockRunCommand.mockRejectedValue(new Error(execError));

    await expect(logout('registry.example.com'))
      .rejects.toThrow('Failed to execute kit command: command not found');
  });
});