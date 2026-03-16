/**
 * @file src/shared/contexts/AdminContext.tsx
 * @description 전역 관리자 권한 상태 관리를 위한 컨텍스트.
 * - 앱 전역에서 단 하나의 권한 체크 로직만 실행되도록 보장.
 * - 세션 변화(로그인/로그아웃)를 실시간으로 감지하여 모든 하위 컴포넌트에 전파.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface AdminContextType {
  /** 현재 사용자가 관리자인지 여부 */
  isAdmin: boolean;
  /** 권한 확인 로직이 진행 중인지 여부 */
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

/** 필옵션: DB 역할 조회가 실패했을 때의 폴백용 관리자 이메일 */
const ADMIN_EMAILS: string[] = ["savior714@gmail.com"];

/** 모듈 수준 캐시: 컨텍스트 마운트 해제 후 재마운트 시 초기값으로 사용 */
let globalCachedIsAdmin: boolean | null = null;

/**
 * 전역 관리자 상태 프로바이더
 */
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(globalCachedIsAdmin ?? false);
  const [isLoading, setIsLoading] = useState<boolean>(globalCachedIsAdmin === null);

  useEffect(() => {
    let mounted = true;

    /** 상태 및 캐시 동기화 */
    const syncAdminStatus = (status: boolean) => {
      console.log(`[Debug] AdminContext sync (isAdmin: ${status})`);
      globalCachedIsAdmin = status;
      if (mounted) {
        setIsAdmin(status);
        setIsLoading(false);
      }
    };

    /** DB에서 사용자 역할(role) 확인 */
    const checkAdmin = async (userId: string, email?: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (error) {
          // 역할 조회 실패 시 이메일 기반 화이트리스트 체크
          let finalEmail = email;
          if (!finalEmail && mounted) {
            // getSession() 호출 시 발생할 수 있는 잠재적 에러 방지
            const { data: { session: currentSession } } = await supabase.auth.getSession()
              .catch(() => ({ data: { session: null } }));
            finalEmail = currentSession?.user?.email;
          }
          syncAdminStatus(ADMIN_EMAILS.includes(finalEmail?.toLowerCase() ?? ""));
          return;
        }

        syncAdminStatus(data?.role === "admin");
      } catch (err) {
        console.error("[AdminContext] Failed to check admin status:", err);
        syncAdminStatus(false);
      }
    };

    /** 초기 세션 확인 */
    const initialize = async () => {
      try {
        // 초기화 시 세션 조회가 실패하더라도 앱이 죽지 않도록 Catch 처리
        const { data: { session } } = await supabase.auth.getSession()
          .catch(() => ({ data: { session: null } }));
        
        if (!mounted) return;

        if (session?.user?.id) {
          await checkAdmin(session.user.id, session.user.email);
        } else {
          syncAdminStatus(false);
        }
      } catch (err) {
        console.warn("[AdminContext] Initialization failed, falling back to guest:", err);
        if (mounted) syncAdminStatus(false);
      }
    };

    initialize();

    /** 인증 상태 변화 구독 */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user?.id) {
        syncAdminStatus(false);
      } else if (session?.user?.id) {
        // [Optimization] 이미 관리자 정보를 알고 있다면(캐시됨), 
        // 세션 갱신 시 로딩 스피너를 띄우지 않고 백그라운드에서 검증만 수행함.
        if (event === "SIGNED_IN" && globalCachedIsAdmin === null) {
          setIsLoading(true);
        }
        checkAdmin(session.user.id, session.user.email);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
};

/**
 * 관리자 권한 상태를 사용하기 위한 훅
 * - useIsAdmin은 이 훅을 래핑하여 기존 인터페이스를 유지할 수 있음.
 */
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
