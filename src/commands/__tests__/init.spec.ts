import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from '../init';
import { runCommand, prepareArgs } from '../../core/exec';
import { resolve } from 'path';

vi.mock('../../core/exec');
vi.mock('path');

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);
const mockResolve = vi.mocked(resolve);

describe('init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockReturnValue([]);
    mockResolve.mockImplementation((path: string) => `/resolved/${path}`);
  });

  it('should work with no arguments', async () => {
    await init();

    expect(mockRunCommand).toHaveBeenCalledWith('init', ['.']);
  });

  it('should call runCommand with default path and prepared args', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: false };
    mockPrepareArgs.mockReturnValue(['--name', 'test', '--desc', 'description']);

    await init('.', flags);

    expect(mockRunCommand).toHaveBeenCalledWith('init', ['.', '--name', 'test', '--desc', 'description']);
  });

  it('should call runCommand with custom path', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: false };
    const customPath = '/custom/path';

    await init(customPath, flags);

    expect(mockRunCommand).toHaveBeenCalledWith('init', [customPath]);
  });

  it('should return resolved paths', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: false };
    mockResolve.mockReturnValueOnce('/resolved/path').mockReturnValueOnce('/resolved/path/Kitfile');

    const result = await init('./test', flags);

    expect(result).toEqual({
      path: '/resolved/path',
      kitfilePath: '/resolved/path/Kitfile'
    });
    expect(mockResolve).toHaveBeenCalledWith('./test');
    expect(mockResolve).toHaveBeenCalledWith('/resolved/path', 'Kitfile');
  });

  it('should handle force flag', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: true };
    mockPrepareArgs.mockReturnValue(['--force']);

    await init('.', flags);

    expect(mockPrepareArgs).toHaveBeenCalledWith(flags);
    expect(mockRunCommand).toHaveBeenCalledWith('init', ['.', '--force']);
  });

  it('should use default path when not provided', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: false };

    await init(undefined as any, flags);

    expect(mockRunCommand).toHaveBeenCalledWith('init', ['.']);
  });
});