import { useEffect, useState } from "react";
import { appLogger } from "@/libs/logger";

export function useEmployeeApiData<T>(
  loader: () => Promise<{ data: T }>,
  deps: readonly unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setFailed(false);

    loader()
      .then((response) => {
        if (mounted) {
          setData(response.data);
        }
      })
      .catch((error) => {
        if (mounted) {
          setFailed(true);
          appLogger.warn("employee.api", "Không thể tải dữ liệu employee.", { error });
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  // The caller provides a stable dependency list for the specific API resource.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, failed };
}
