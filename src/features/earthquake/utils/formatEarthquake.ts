export const formatEarthquakeDateTime = (
  isoString: string
): { date: string; time: string } => {
  const d = new Date(isoString);
  const date = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};
