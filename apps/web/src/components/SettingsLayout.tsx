import Link from "next/link";
import { useRouter } from "next/router";
import { HiOutlineUser } from "react-icons/hi2";

interface SettingsLayoutProps {
  children: React.ReactNode;
  currentTab: string;
}

export function SettingsLayout({ children, currentTab }: SettingsLayoutProps) {
  const router = useRouter();

  const settingsTabs = [
    {
      key: "account",
      icon: <HiOutlineUser />,
      label: "Account",
    },
  ];

  const isTabActive = (tabKey: string) => {
    return currentTab === tabKey;
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="h-full max-h-[calc(100vdh-3rem)] overflow-y-auto md:max-h-[calc(100vdh-4rem)]">
        <div className="m-auto max-w-[1100px] px-5 py-6 md:px-28 md:py-12">
          <div className="mb-8 flex w-full justify-between">
            <h1 className="font-bold tracking-tight text-neutral-900 dark:text-dark-1000 sm:text-[1.2rem]">
              {"Settings"}
            </h1>
          </div>

          <div className="focus:outline-none">
            <div className="sm:hidden">
              <div className="relative mb-4">
                <div className="w-full rounded-lg border-0 bg-light-50 py-2 pl-3 pr-10 text-left text-sm text-light-1000 shadow-sm ring-1 ring-inset ring-light-300 dark:bg-dark-50 dark:text-dark-1000 dark:ring-dark-300">
                  {settingsTabs[0]?.label}
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="border-b border-gray-200 dark:border-white/10">
                <nav
                  aria-label="Tabs"
                  className="-mb-px flex space-x-8 focus:outline-none"
                >
                  {settingsTabs.map((tab) => (
                    <Link
                      key={tab.key}
                      href={`/settings/${tab.key}`}
                      className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors focus:outline-none ${
                        isTabActive(tab.key)
                          ? "border-light-1000 text-light-1000 dark:border-dark-1000 dark:text-dark-1000"
                          : "border-transparent text-light-900 hover:border-light-950 hover:text-light-950 dark:text-dark-900 dark:hover:border-white/20 dark:hover:text-dark-950"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
            <div className="focus:outline-none">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
