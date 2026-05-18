import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axiosConfig';
import { CACHE_DURATION } from '../utils/constants';

/**
 * Custom hook for fetching data with caching
 * @param {string} url - API endpoint URL
 * @param {Object} options - Configuration options
 * @param {number} options.cacheDuration - Cache duration in milliseconds
 * @param {boolean} options.skip - Skip fetching if true
 * @param {Array} options.dependencies - Refetch dependencies
 * @returns {Object} { data, loading, error, refetch }
 */
export const useAPI = (url, options = {}) => {
  const {
    cacheDuration = CACHE_DURATION.MEDIUM,
    skip = false,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());
  const timestampsRef = useRef(new Map());

  const isCacheValid = useCallback((url) => {
    const timestamp = timestampsRef.current.get(url);
    if (!timestamp) return false;
    return Date.now() - timestamp < cacheDuration;
  }, [cacheDuration]);

  const refetch = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (cacheRef.current.has(url) && isCacheValid(url)) {
        setData(cacheRef.current.get(url));
        setLoading(false);
        return;
      }

      const response = await API.get(url);
      cacheRef.current.set(url, response.data);
      timestampsRef.current.set(url, Date.now());
      setData(response.data);
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [url, isCacheValid]);

  useEffect(() => {
    if (skip || !url) {
      setLoading(false);
      return;
    }

    refetch();
  }, [url, skip, refetch, ...dependencies]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    timestampsRef.current.clear();
  }, []);

  return { data, loading, error, refetch, clearCache };
};

/**
 * Custom hook for posting data
 * @param {string} url - API endpoint URL
 * @returns {Object} { execute, loading, error, data }
 */
export const useAPIPost = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);

      try {
        const response = await API.post(url, payload);
        setData(response.data);
        return response.data;
      } catch (err) {
        console.error(`Error posting to ${url}:`, err);
        setError(err.message || 'Failed to post data');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  return { execute, loading, error, data };
};

/**
 * Custom hook for updating data
 * @param {string} url - API endpoint URL
 * @returns {Object} { execute, loading, error, data }
 */
export const useAPIPut = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);

      try {
        const response = await API.put(url, payload);
        setData(response.data);
        return response.data;
      } catch (err) {
        console.error(`Error updating at ${url}:`, err);
        setError(err.message || 'Failed to update data');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  return { execute, loading, error, data };
};

/**
 * Custom hook for deleting data
 * @param {string} url - API endpoint URL
 * @returns {Object} { execute, loading, error }
 */
export const useAPIDelete = (url) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await API.delete(url);
      return true;
    } catch (err) {
      console.error(`Error deleting at ${url}:`, err);
      setError(err.message || 'Failed to delete data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { execute, loading, error };
};
