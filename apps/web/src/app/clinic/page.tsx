import { redirect } from 'next/navigation';

export default function ClinicIndexPage() {
  redirect('/clinic/clients');
}
