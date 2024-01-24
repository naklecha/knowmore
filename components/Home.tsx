'use client';

import { useSupabase } from '@/app/supabase-provider';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { ChangeEvent, useState } from 'react';
import { v4 as uuid } from 'uuid';

interface Props {
  user: User | null | undefined;
}

export default function Home({ user }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [blurData, setBlurData] = useState(false);

  const { supabase } = useSupabase();

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    const file = e.target.files && e.target.files[0];

    // validate the file to see if it has a column named email.
    // if it does, then we can upload it.

    if (file && file.name.endsWith('.csv')) {
      try {
        Papa.parse(file!, {
          complete: async function (results) {
            // Go through each row and find any email using regex and add it to set.
            const emails = new Set<string>();
            for (const row of results.data) {
              for (const cell of row) {
                const emailRegex = /\S+@\S+\.\S+/;
                if (emailRegex.test(cell)) {
                  emails.add(cell);
                }
              }
            }

            if (emails.size === 0) {
              throw new Error('No emails found');
            }

            const id = uuid();

            // Upload the file to storage.
            const filePath = `public/${id}.csv`;
            const bucket = 'documents';
            const { data: uploadData, error: uploadError } =
              await supabase.storage.from(bucket).upload(filePath, file);

            if (uploadError) {
              console.error('Error uploading CSV:', uploadError.message);
              return;
            }

            

            // Insert the document into the documents table.
            const { data: insertData, error: insertError } = await supabase
              .from('documents')
              .insert([
                {
                  id,
                  storage_path: filePath,
                  owner: user?.id
                }
              ]);

            if (insertError) {
              console.error(
                'Error inserting row into documents table:',
                insertError.message
              );
              return;
            }

            // Create lead entries for each email.

            const emailArray = Array.from(emails);
            const emailObjects = emailArray.map((email) => ({
              email,
              document_id: id,
            }));
            const { data: leadInsertData, error: leadInsertError } =
              await supabase.from('leads').insert(emailObjects);

            if (leadInsertError) {
              console.error(
                'Error inserting row into leads table:',
                leadInsertError.message
              );
              return;
            }

            setLoading(false);
            router.push(`/view/${id}`);
          }
        });
      } catch (error) {
        console.error('Error uploading CSV:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBlurToggle = () => {
    setBlurData(!blurData);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="text-white py-20 bg-opacity-10">
        <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center">
          <div className="flex flex-col w-full lg:w-1/2 mb-8 lg:mb-0 lg:pr-8 gap-8">
            <h1
              className="text-4xl lg:text-6xl font-bold mb-4 gap-4"
              style={{
                fontSize: '64px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: '110%',
                letterSpacing: '-1.28px',
                background:
                  'linear-gradient(146deg, #FFF 45.88%, rgba(255, 255, 255, 0.50) 88.34%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Turn website leads into paid customers fast.
            </h1>
            <p className="text-lg">
              Our AI bot scrapes every B2B lead you pull from your website so
              that you know exactly who your potential customers are. Stop
              leaving money on the table.
            </p>

            <div
              style={{
                display: 'flex',
                padding: '48px',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                alignSelf: 'stretch',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(0, 0, 0, 0.15)'
              }}
              //   onDragOver={handleDragOver}
              //   onDrop={handleDrop}
            >
              {loading ? (
                <p>Loading</p>
              ) : (
                <>
                  <label htmlFor="file-upload" className="file-upload-label">
                    <span style={{ display: 'none' }}>Upload File</span>
                    <div
                      style={{
                        display: 'flex',
                        padding: '16px 48px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '56px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: '#E85533',
                        boxShadow: '0px 0px 28px 0px rgba(255, 255, 255, 0.15)',
                        fontWeight: 700
                      }}
                    >
                      Upload File
                    </div>
                  </label>
                  <input
                    type="file"
                    id="file-upload"
                    accept=".csv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex justify-center items-center">
            <Image
              alt="hero"
              src={'/hero-image.png'}
              width={300}
              height={300}
            />
          </div>
        </div>
        <LogoCloud />
      </div>
    </div>
  );
}


function LogoCloud() {
  return (
    <div>
      <p className="mt-24 text-xs uppercase text-zinc-400 text-center font-bold tracking-[0.3em]">
        Brought to you by
      </p>
      <div className="flex flex-col items-center my-12 space-y-4 sm:mt-8 sm:space-y-0 md:mx-auto md:max-w-2xl sm:grid sm:gap-6 sm:grid-cols-5">
        <div className="flex items-center justify-start">
          <a href="https://nextjs.org" aria-label="Next.js Link">
            <img
              src="/nextjs.svg"
              alt="Next.js Logo"
              className="h-12 text-white"
            />
          </a>
        </div>
        <div className="flex items-center justify-start">
          <a href="https://vercel.com" aria-label="Vercel.com Link">
            <img
              src="/vercel.svg"
              alt="Vercel.com Logo"
              className="h-6 text-white"
            />
          </a>
        </div>
        <div className="flex items-center justify-start">
          <a href="https://stripe.com" aria-label="stripe.com Link">
            <img
              src="/stripe.svg"
              alt="stripe.com Logo"
              className="h-12 text-white"
            />
          </a>
        </div>
        <div className="flex items-center justify-start">
          <a href="https://supabase.io" aria-label="supabase.io Link">
            <img
              src="/supabase.svg"
              alt="supabase.io Logo"
              className="h-10 text-white"
            />
          </a>
        </div>
        <div className="flex items-center justify-start">
          <a href="https://github.com" aria-label="github.com Link">
            <img
              src="/github.svg"
              alt="github.com Logo"
              className="h-8 text-white"
            />
          </a>
        </div>
      </div>
    </div>
  );
}