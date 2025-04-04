// app/page.tsx
import { redirect } from 'next/navigation';

const Page = () => {
  // Redireciona automaticamente para /login
  redirect('/login');

  // Não precisa renderizar nada
  return null;
};

export default Page;