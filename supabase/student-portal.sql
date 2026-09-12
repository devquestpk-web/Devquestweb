-- Student Portal Schema Additions for Supabase (PostgreSQL)

-- 1. Extend existing profiles check constraint to allow 'student' role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('member', 'ambassador', 'team', 'admin', 'student'));

-- 2. Add student-specific fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS discord_handle TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    instructor_name TEXT,
    instructor_title TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Course Lessons Table
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT,
    duration INTEGER,
    order_index INTEGER NOT NULL
);

-- 5. Lesson Progress Table
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, lesson_id)
);

-- 6. Webinars Table
CREATE TABLE IF NOT EXISTS public.webinars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    meeting_link TEXT,
    max_seats INTEGER,
    speaker_name TEXT,
    speaker_title TEXT,
    venue TEXT DEFAULT 'Online',
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('COURSE', 'WEBINAR')),
    course_id UUID REFERENCES public.courses(id),
    webinar_id UUID REFERENCES public.webinars(id),
    amount NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT NOT NULL UNIQUE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('COURSE', 'WEBINAR')),
    course_id UUID REFERENCES public.courses(id),
    webinar_id UUID REFERENCES public.webinars(id),
    qr_payload TEXT NOT NULL,
    is_checked_in BOOLEAN DEFAULT FALSE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('COURSE', 'WEBINAR')),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT DEFAULT 'PDF',
    item_type TEXT NOT NULL CHECK (item_type IN ('COURSE', 'WEBINAR')),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE
);

-- 11. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_code TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('COURSE', 'WEBINAR')),
    course_id UUID REFERENCES public.courses(id),
    webinar_id UUID REFERENCES public.webinars(id),
    pdf_url TEXT NOT NULL,
    verification_url TEXT NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_tickets_code ON public.tickets(ticket_code);
CREATE INDEX idx_certificates_code ON public.certificates(cert_code);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies

-- Courses & Webinars: Anyone can read published content
CREATE POLICY "Public can view published courses" ON public.courses FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public can view published webinars" ON public.webinars FOR SELECT USING (is_published = TRUE);

-- Course Lessons: Accessible if the course is published (actual video URLs are gated by application logic if needed, but schema allows reading titles)
CREATE POLICY "Public can view lessons for published courses" ON public.course_lessons FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_lessons.course_id AND is_published = TRUE)
);

-- Lesson Progress: Users can only read/update their own
CREATE POLICY "Users can view their own progress" ON public.lesson_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update their own progress" ON public.lesson_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Orders, Tickets, Enrollments: Users can view their own
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view their own tickets" ON public.tickets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view their own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Resources: Users can view resources for courses/webinars they are enrolled in
CREATE POLICY "Enrolled students can view resources" ON public.resources FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.enrollments
        WHERE user_id = auth.uid()
        AND (
            (item_type = 'COURSE' AND course_id = resources.course_id) OR
            (item_type = 'WEBINAR' AND webinar_id = resources.webinar_id)
        )
    )
);

-- Certificates: Verification is public, students can see their own list
CREATE POLICY "Public can view and verify certificates" ON public.certificates FOR SELECT USING (TRUE);

-- Admin bypass: Admins can do everything on all tables
CREATE POLICY "Admins have full access to courses" ON public.courses TO authenticated USING (is_devquest_admin());
CREATE POLICY "Admins have full access to course_lessons" ON public.course_lessons TO authenticated USING (is_devquest_admin());
CREATE POLICY "Admins have full access to lesson_progress" ON public.lesson_progress TO authenticated USING (is_devquest_admin());
CREATE POLICY "Admins have full access to webinars" ON public.webinars TO authenticated USING (is_devquest_admin());
CREATE POLICY "Admins have full access to orders" ON public.orders TO authenticated USING (is_devquest_admin());
CREATE POLICY "Admins have full access to tickets" ON public.tickets TO authenticated USING (is_devquest_admin());
CREATE POLICY "Admins have full access to enrollments" ON public.enrollments TO authenticated USING (is_devquest_admin());
CREATE POLICY "Admins have full access to resources" ON public.resources TO authenticated USING (is_devquest_admin());
CREATE POLICY "Admins have full access to certificates" ON public.certificates TO authenticated USING (is_devquest_admin());
