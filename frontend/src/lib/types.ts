export type User = {
  id: string;
  email: string;
  twitchUrl: string | null;
  logoUrl: string | null;
  createdAt: string;
};

export type Planning = {
  id: string;
  name: string;
  weekStart: string; // ISO
  weekEnd: string; // ISO
  bgColor?: string | null;
  textColor?: string | null;
  accentColor?: string | null;
  createdAt?: string;
};

export type EventItem = {
  id: string;
  planningId: string;
  title: string | null;
  gameName: string;
  gameImageUrl: string | null;
  startsAt: string; // ISO
  endsAt: string; // ISO
};
