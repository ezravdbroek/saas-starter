'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
            <span className="text-white text-xl font-bold">H</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {mode === 'signin'
            ? 'Inloggen bij Hiro'
            : 'Account aanmaken'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {mode === 'signin'
            ? 'Voer je gegevens in om verder te gaan'
            : 'Maak een account aan om te beginnen'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-200">
          <form className="space-y-5" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                E-mailadres
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="w-full rounded-lg"
                placeholder="naam@bedrijf.nl"
              />
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Wachtwoord
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="w-full rounded-lg"
                placeholder="Minimaal 8 tekens"
              />
            </div>

            {state?.error && (
              <div className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-10"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Even geduld...
                </>
              ) : mode === 'signin' ? (
                'Inloggen'
              ) : (
                'Account aanmaken'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {mode === 'signin' ? (
            <>
              Nog geen account?{' '}
              <Link
                href={`/sign-up${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Registreer je hier
              </Link>
            </>
          ) : (
            <>
              Heb je al een account?{' '}
              <Link
                href={`/sign-in${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Log hier in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
