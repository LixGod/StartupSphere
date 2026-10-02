import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!supabaseUrl) {
      console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    if (!supabaseServiceKey) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      email,
      password,
      companyName,
      ownerId,
      requestId,
    } = body

    // Use service role key to bypass RLS and email verification
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('🔄 Creating user with admin API...')

    // Create user with admin API - this doesn't require email confirmation
    const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      console.error('❌ Auth creation error:', authError)
      return NextResponse.json(
        { error: `Auth creation failed: ${authError.message}` },
        { status: 400 }
      )
    }

    console.log('✅ User created in auth:', newUser.user?.id)

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'User creation returned no user data' },
        { status: 400 }
      )
    }

    // Create profile for the new user
    console.log('🔄 Creating profile for:', newUser.user.id, email)

    const { error: profileError } = await adminSupabase.from('profiles').upsert({
      id: newUser.user.id,
      company_name: companyName,
      role: 'employee',
      owner_id: ownerId,
      email: email,
      can_manage_inventory: false,
      can_manage_sales: false,
      can_manage_accounting: false,
    }, {
      onConflict: 'id'
    })

    if (profileError) {
      console.error('❌ Profile creation error:', profileError)
      // Attempt to delete the user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: `Profile creation failed: ${profileError.message}` },
        { status: 400 }
      )
    }

    console.log('✅ Profile created')

    // Delete the employee request
    console.log('🔄 Deleting employee request:', requestId)

    const { error: deleteError } = await adminSupabase
      .from('employee_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('❌ Delete request error:', deleteError)
      return NextResponse.json(
        { error: `Request deletion failed: ${deleteError.message}` },
        { status: 400 }
      )
    }

    console.log('✅ Request deleted')

    return NextResponse.json({
      success: true,
      userId: newUser.user.id,
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    )
  }
}
