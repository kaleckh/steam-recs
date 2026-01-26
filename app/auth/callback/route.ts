import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/profile';
  const type = searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For password recovery, redirect to a password update page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }

      // Successful auth - redirect to the intended destination
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Auth code error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
