import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, loginUnsafe } from '../login';
import { runCommand } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);

describe('loginUnsafe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runCommand with correct arguments', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Login successful',
      stderr: '',
      exitCode: 0
    });

    await loginUnsafe('registry.example.com', 'testuser', 'testpass');

    expect(mockRunCommand).toHaveBeenCalledWith('login', [
      'registry.example.com',
      '--username',
      'testuser',
      '--password',
      'testpass'
    ]);
  });

  it('should handle successful login', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Login Succeeded',
      stderr: '',
      exitCode: 0
    });

    await expect(loginUnsafe('hub.docker.com', 'myuser', 'mypassword')).resolves.not.toThrow();
  });

  it('should propagate errors from runCommand', async () => {
    const errorMessage = 'Kit command failed with exit code 1: authentication failed';
    mockRunCommand.mockRejectedValue(new Error(errorMessage));

    await expect(loginUnsafe('registry.example.com', 'wronguser', 'wrongpass'))
      .rejects.toThrow(errorMessage);
  });

  it('should handle empty registry parameter', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0
    });

    await loginUnsafe('', 'testuser', 'testpass');

    expect(mockRunCommand).toHaveBeenCalledWith('login', [
      '',
      '--username',
      'testuser',
      '--password',
      'testpass'
    ]);
  });

  it('should handle special characters in credentials', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Login Succeeded',
      stderr: '',
      exitCode: 0
    });

    const specialUsername = 'user@domain.com';
    const specialPassword = 'pass$word!123';

    await loginUnsafe('registry.example.com', specialUsername, specialPassword);

    expect(mockRunCommand).toHaveBeenCalledWith('login', [
      'registry.example.com',
      '--username',
      specialUsername,
      '--password',
      specialPassword
    ]);
  });

  it('should handle different registry formats', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Login Succeeded',
      stderr: '',
      exitCode: 0
    });

    const registries = [
      'localhost:5000',
      'https://registry.example.com',
      'registry.example.com:8080',
      'gcr.io',
    ];

    for (const registry of registries) {
      await loginUnsafe(registry, 'user', 'pass');
      expect(mockRunCommand).toHaveBeenCalledWith('login', [
        registry,
        '--username',
        'user',
        '--password',
        'pass'
      ]);
    }

    expect(mockRunCommand).toHaveBeenCalledTimes(registries.length);
  });

  it('should handle authentication failure gracefully', async () => {
    const authError = 'Kit command failed with exit code 1: Error response from daemon: unauthorized';
    mockRunCommand.mockRejectedValue(new Error(authError));

    await expect(loginUnsafe('registry.example.com', 'baduser', 'badpass'))
      .rejects.toThrow('Kit command failed with exit code 1: Error response from daemon: unauthorized');
  });

  it('should handle network errors', async () => {
    const networkError = 'Failed to execute kit command: connect ECONNREFUSED';
    mockRunCommand.mockRejectedValue(new Error(networkError));

    await expect(loginUnsafe('unreachable.registry.com', 'user', 'pass'))
      .rejects.toThrow('Failed to execute kit command: connect ECONNREFUSED');
  });
});

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass the password via stdin', async () => {
    mockRunCommand.mockResolvedValue({ stdout: 'Login Succeeded', stderr: '', exitCode: 0 });

    await login('registry.example.com', 'testuser', 'testpass');

    expect(mockRunCommand).toHaveBeenCalledWith(
      'login',
      ['registry.example.com', '--username', 'testuser', '--password-stdin'],
      'testpass',
    );
  });

  it('should resolve on successful login', async () => {
    mockRunCommand.mockResolvedValue({ stdout: 'Login Succeeded', stderr: '', exitCode: 0 });

    await expect(login('registry.example.com', 'user', 'pass')).resolves.not.toThrow();
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: unauthorized'));

    await expect(login('registry.example.com', 'user', 'wrongpass'))
      .rejects.toThrow('Kit command failed with exit code 1: unauthorized');
  });
});