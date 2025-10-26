import { useClerk } from '@clerk/shared/react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';

type LogoutProps = {
  onLogout: () => void;
};

export const Logout = ({ onLogout }: LogoutProps) => {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await queryClient.invalidateQueries();
    await signOut({ redirectUrl: '/login' });
    onLogout();
  };

  return (
    <div>
      <button
        onClick={handleLogout}
        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  );
};
