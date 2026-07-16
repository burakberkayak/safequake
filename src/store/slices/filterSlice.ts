import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EarthquakeFilters, TimeRangeFilter, MagnitudeFilter, RadiusFilter } from '../../features/earthquake/types/earthquake.types';

interface FilterState {
  filters: EarthquakeFilters;
}

const initialState: FilterState = {
  filters: {
    timeRange: '24h',
    minMagnitude: undefined,
    radiusKm: undefined,
    originLatitude: undefined,
    originLongitude: undefined,
  },
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<EarthquakeFilters>) => {
      state.filters = action.payload;
    },
    setTimeRange: (state, action: PayloadAction<TimeRangeFilter>) => {
      state.filters.timeRange = action.payload;
    },
    setMinMagnitude: (state, action: PayloadAction<MagnitudeFilter | undefined>) => {
      state.filters.minMagnitude = action.payload;
    },
    setRadius: (state, action: PayloadAction<{ radiusKm: RadiusFilter | undefined; lat?: number; lon?: number }>) => {
      state.filters.radiusKm = action.payload.radiusKm;
      state.filters.originLatitude = action.payload.lat;
      state.filters.originLongitude = action.payload.lon;
    },
    resetFilters: (state) => {
      state.filters = {
        timeRange: '24h',
        minMagnitude: undefined,
        radiusKm: undefined,
        originLatitude: undefined,
        originLongitude: undefined,
      };
    },
  },
});

export const { setFilters, setTimeRange, setMinMagnitude, setRadius, resetFilters } = filterSlice.actions;
export default filterSlice.reducer;
