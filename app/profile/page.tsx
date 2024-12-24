'use client';

import Link from "next/link";

import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Page() {
  return <div className="page p-24">
    <main>
      <section>
        <p className="row">
          <span className="inline-flex align-center mr-8">
            邮箱
            <MailOutlineRoundedIcon />
          </span>
          <Link href={"mailto:d1zzzy.fe@gmail.com"} >
            <span>d1zzzy.fe@gmail</span>
          </Link>
        </p>
        <p className="row">
          <Link href={"https://github.com/d1zzzzy"} >
            <GitHubIcon />
          </Link>
        </p>
      </section>
    </main>
  </div>;
}
