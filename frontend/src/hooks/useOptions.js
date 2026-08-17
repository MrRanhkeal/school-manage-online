import { useEffect, useRef, useState } from 'react';
import api, { unwrap } from '../services/api';

/** Resolve an id to its option label */
export const optionLabel = (options, value, fallback = '—') =>
  options.find((o) => o.value === value)?.label ??
  (value || fallback);

export default function useOptions(
  url,
  getLabel,
  params = { page: 1, limit: 100 }
) {
  const [options, setOptions] = useState([]);

  const getLabelRef = useRef(getLabel);
  getLabelRef.current = getLabel;

  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await api.get(url, {
          params: paramsRef.current,
        });

        if (!alive) return;

        const payload = unwrap(res);

        let items = [];

        if (Array.isArray(payload)) {
          items = payload;
        } else if (Array.isArray(payload?.items)) {
          items = payload.items;
        } else if (Array.isArray(payload?.data)) {
          items = payload.data;
        }

        setOptions(
          items.map((row) => ({
            value: row.id,
            label: getLabelRef.current(row),
          }))
        );
      } catch {
        if (alive) {
          setOptions([]);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [url]);

  return options;
}

// import { useEffect, useRef, useState } from 'react';
// import api, { unwrap } from '../services/api'; 


// /**
//  * Load a related entity list (classes, teachers, …) and map it to
//  * [{ value: id, label }] options for selects in forms and filters.
//  *
//  * url:      list endpoint, e.g. ENDPOINTS.classes.list
//  * getLabel: (row) => string shown in the dropdown
//  */
// /** Resolve an id to its option label (e.g. render a student name for a stored studentId). */
// export const optionLabel = (options, value, fallback = '—') =>
//   options.find((o) => o.value === value)?.label ?? (value || fallback);

// export default function useOptions(url, getLabel, params = { page: 1, limit: 100 }) {
//   const [options, setOptions] = useState([]);
//   // Keep the latest mappers without retriggering the fetch.
//   const getLabelRef = useRef(getLabel);
//   getLabelRef.current = getLabel;
//   const paramsRef = useRef(params);
//   paramsRef.current = params;

//   useEffect(() => {
//     let alive = true;
//     api
//       .get(url, { params: paramsRef.current })
//       .then((res) => {
//         if (!alive) return;
//         const items = unwrap(res) || [];
//         setOptions(items.map((r) => ({ value: r.id, label: getLabelRef.current(r) })));
//       })
//       .catch(() => {
//         // Options stay empty; the form field still accepts no selection.
//       });
//     return () => {
//       alive = false;
//     };
//   }, [url]);

//   return options;
// }
