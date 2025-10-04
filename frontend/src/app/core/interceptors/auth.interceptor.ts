import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const supabase = inject(SupabaseService);

  return from(supabase.auth.getSession()).pipe(
    switchMap(({ data: { session } }) => {
      if (session?.access_token) {
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${session.access_token}`)
        });
        return next(authReq);
      }
      return next(req);
    })
  );
};
