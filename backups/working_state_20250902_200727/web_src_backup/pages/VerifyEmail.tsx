import { EmailLinkErrorCode, useEmailLink } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VerifyEmail() {
  const { isLoaded, isExpired, isVerified, emailAddress, setEmailAddress } = useEmailLink()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && isVerified) {
      // Email verified successfully, redirect to dashboard
      navigate('/dashboard', { replace: true })
    }
  }, [isLoaded, isVerified, navigate])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verifying your email...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verification Link Expired
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The verification link has expired. Please try signing up again.
            </p>
            <button
              onClick={() => navigate('/sign-up')}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Sign Up
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Email Verified!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to your email address.
          </p>
          {emailAddress && (
            <p className="mt-2 text-sm text-gray-600">
              Check your inbox at <strong>{emailAddress}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 