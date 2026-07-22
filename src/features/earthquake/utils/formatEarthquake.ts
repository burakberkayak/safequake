export const formatEarthquakeDateTime = (
  isoString: string,
  lang: string = 'tr'
): { date: string; time: string } => {
  const d = new Date(isoString);
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  const date = d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};
