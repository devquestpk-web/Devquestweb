-- Versioned student welcome email with a clear portal login action.
begin;

insert into public.email_templates(template_key, name, subject, html_body, version, is_active)
values (
  'student_welcome',
  'Student portal login',
  'Your DevQuest Student Portal is ready',
  '<h2>Welcome to DevQuest PK</h2><p>Hello {{student_name}},</p><p>Your student account is ready. Your DevQuest Student ID is <strong>{{student_id}}</strong>.</p><p style="margin:28px 0"><a href="{{portal_url}}" style="display:inline-block;background:#0b5cff;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:10px">Log in to Student Portal</a></p><p>Use the email address you registered with to sign in.</p>',
  2,
  true
)
on conflict(template_key, version) do update set
  name = excluded.name,
  subject = excluded.subject,
  html_body = excluded.html_body,
  is_active = true,
  updated_at = now();

commit;
