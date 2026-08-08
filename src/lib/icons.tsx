/* eslint-disable react-refresh/only-export-components */
import {
  Landmark, Laptop, Gift, ShoppingCart, UtensilsCrossed, Bus, Home, Plug,
  HeartPulse, Clapperboard, ShoppingBag, Repeat, Wallet as WalletIcon,
  PiggyBank, CreditCard, Smartphone, GraduationCap, Plane, PawPrint,
  Baby, Shirt, Fuel, Wrench, Gamepad2, Coffee, Dumbbell, Scissors,
  Smile, Tag, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Landmark, Laptop, Gift, ShoppingCart, UtensilsCrossed, Bus, Home, Plug,
  HeartPulse, Clapperboard, ShoppingBag, Repeat, GraduationCap, Plane,
  PawPrint, Baby, Shirt, Fuel, Wrench, Gamepad2, Coffee, Dumbbell,
  Scissors, Smile, Tag, Wallet: WalletIcon, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, PiggyBank,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICONS);

export const WALLET_ICONS: Record<string, LucideIcon> = {
  cash: WalletIcon,
  bank: CreditCard,
  savings: PiggyBank,
  digital: Smartphone,
};
