"use client";

import AdminSearchBar from "./AdminSearchBar";

export default function AdminSitesTab({
  sites,
  searchTerm,
  setSearchTerm,
  handleSearch,
  handleSiteClick,
  handleLoadMoreSites,
  handleSoftDeleteSite,
  handleHardDeleteSite,
  handleReactivateSite,
  hasMoreSites,
  isLoadingMore,
}) {
  return (
    <div className="space-y-6">
      <AdminSearchBar
        placeholder="Search sites by name, URL, or user ID..."
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Sites ({sites.length})</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sites.map((site) => (
            <div
              key={site.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSiteClick(site)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{site.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{site.url}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    User: {site.user_id} | ID: {site.id}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      site.is_active === false ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {site.is_active === false ? "Inactive" : "Active"}
                  </span>

                  {site.is_active === false ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReactivateSite(site.id);
                        }}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                        title="Reactivate this site"
                      >
                        Reactivate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHardDeleteSite(site.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                        title="Permanently delete this site"
                      >
                        Hard Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSoftDeleteSite(site.id);
                        }}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                        title="Deactivate this site"
                      >
                        Soft Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHardDeleteSite(site.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                        title="Permanently delete this site"
                      >
                        Hard Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {hasMoreSites && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLoadMoreSites}
              disabled={isLoadingMore}
              className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show More
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
