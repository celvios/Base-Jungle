import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/contexts/wallet-context";
import { User, LogOut, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface WalletProfileProps {
  showConnectButton?: boolean;
}

export function WalletProfile({ showConnectButton = true }: WalletProfileProps) {
  const { address, isConnected, connect, disconnect } = useWallet();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setLocation("/");
  };

  if (!isConnected || !address) {
    if (!showConnectButton) {
      return null;
    }
    return (
      <Button
        variant="default"
        onClick={connect}
        className="w-full md:w-auto"
        data-testid="button-connect-wallet"
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          data-testid="button-wallet-profile"
        >
          <User className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs text-muted-foreground">Wallet Address</p>
            <code className="text-sm font-mono" data-testid="text-wallet-address">
              {address}
            </code>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCopyAddress}
          data-testid="button-copy-address"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="text-red-500 dark:text-red-400"
          data-testid="button-disconnect-wallet"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
