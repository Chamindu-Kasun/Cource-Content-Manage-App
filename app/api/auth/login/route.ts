import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('Login attempt for username:', username);

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log('Admin username configured:', !!adminUsername);
    console.log('Admin password configured:', !!adminPassword);

    if (!adminUsername || !adminPassword) {
      console.log('Missing configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (username !== adminUsername || password !== adminPassword) {
      console.log('Invalid credentials provided');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('Credentials valid, setting session');

    // Create response with simple session cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        user: { username, role: 'admin' }
      },
      { status: 200 }
    );

    response.cookies.set('admin-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    console.log('Login successful, session set');
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}