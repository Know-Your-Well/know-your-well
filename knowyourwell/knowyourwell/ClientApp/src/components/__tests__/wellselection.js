import React from 'react';
import { render, waitFor, screen, fireEvent, act } from '@testing-library/react';
import Wellselection from '../wellselection';
import Axios from 'axios';
import { MemoryRouter, Router, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import WellFieldLabContext from '../reusable/WellFieldLabContext';
import { createMemoryHistory } from 'history';

global.ResizeObserver = require('resize-observer-polyfill');

jest.mock('axios');

jest.mock('../usercontext', () => ({ 
  useUser: () => ({
    user: { displayn: 'testuser' },
    setUser: jest.fn(),
  }),
}));

const sampleWells = {
  Wells: [
    {
      well_id: 1,
      wi_wellcode: 'UNL001',
      wi_wellname: 'Alpha Wellselection',
      wi_estlatitude: 40.0,
      wi_estlongitude: -96.0,
      wi_well_owner: 'Owner A',
      county_id: 1,
      nrd_id: 100,  
      fieldActivity: {
        fa_datecollected: '2025-01-01T00:00:00Z'
      }
    },
    {
      well_id: 2,
      wi_wellcode: 'UNL002',
      wi_wellname: 'Beta Wellselection',
      wi_estlatitude: 41.0,
      wi_estlongitude: -97.0,
      wi_well_owner: 'Owner B',
      county_id: 2,
      nrd_id: 200,
      fieldActivity: {
        fa_datecollected: '2025-02-01T00:00:00Z'
      }
    },
    {
      well_id: 3,
      wi_wellcode: 'UNL003',
      wi_wellname: 'Charlie Wellselection',
      wi_estlatitude: 42.0,
      wi_estlongitude: -98.0,
      wi_well_owner: 'Owner C',
      county_id: 1,
      nrd_id: 100,
      fieldActivity: {
        fa_datecollected: '2025-03-01T00:00:00Z'
      },
    }
  ]
};

const mockedWellFieldLabContext = {
  coords: { latitude: 40.0, longitude: -96.0 },
};

const renderWellWithContext = () => {
  return render(
    <MemoryRouter>
      <WellFieldLabContext.Provider value={mockedWellFieldLabContext}>
        <Wellselection />
      </WellFieldLabContext.Provider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  sessionStorage.removeItem("tabIndex");
});

describe('Geographic Map Interface in Wellselection Component', () => {
  test('renders the map interface', async () => {
    sessionStorage.setItem("tabIndex", "0");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));

    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });

    const { container } = renderWellWithContext();

    await waitFor(() => {
      const mapContainer = document.getElementById('map-container');
      expect(mapContainer).toBeInTheDocument();
      expect(mapContainer.classList).toContain('leaflet-container');
    });
  });

  test('displays marker images based on wells data', async () => {
    sessionStorage.setItem("tabIndex", "0");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));

    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });

    renderWellWithContext();

    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });

    await waitFor(() => {
      const markers = document.querySelectorAll('img[src*="wellIcon.png"]');
      expect(markers.length).toBeGreaterThanOrEqual(sampleWells.Wells.length);
    });
  });

  test('toggles satellite layer on and off', async () => {
    sessionStorage.setItem("tabIndex", "0");
    sessionStorage.setItem("showSatellite", "true");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    renderWellWithContext();
  
    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });
  
    const satelliteToggle = screen.getByLabelText(/Show Satellite Layer/i);
    expect(satelliteToggle).toBeInTheDocument();
  
    expect(satelliteToggle).toBeChecked();
  
    fireEvent.click(satelliteToggle);
  
    expect(satelliteToggle).not.toBeChecked();
    expect(sessionStorage.getItem("showSatellite")).toBe("false");
  
    fireEvent.click(satelliteToggle);

    expect(satelliteToggle).toBeChecked();
    expect(sessionStorage.getItem("showSatellite")).toBe("true");
  });

  test('the Create New Wellselection button has the correct href', async () => {
    sessionStorage.setItem("tabIndex", "0");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    const history = createMemoryHistory({ initialEntries: ["/"] });
  
    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    render(
      <Router location={history.location} navigator={history}>
        <Routes>
          <Route 
            path="/" 
            element={
              <WellFieldLabContext.Provider value={mockedWellFieldLabContext}>
                <Wellselection />
              </WellFieldLabContext.Provider>
            }
          />
          <Route path="/WellInfo" element={<div>Create Wellselection Page</div>} />
        </Routes>
      </Router>
    );
  
    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });
  
    const createWellButton = screen.getByText("Create New Wellselection");
    expect(createWellButton).toBeInTheDocument();
    expect(createWellButton.tagName).toBe("A");
    expect(createWellButton).toHaveAttribute("href", "/WellInfo");
  });

  test('shows filter indicator in map view when any filter is active', async () => {
    sessionStorage.setItem("tabIndex", "0");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));

    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });

    renderWellWithContext();

    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    const searchInput = screen.getByPlaceholderText("Search by well name");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Alpha" } });
    });

    const indicator = filterButton.querySelector('span');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle({
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      width: '13px',
      height: '13px',
      background: 'red',
      borderRadius: '60%'
    });
  });
});

describe('Wellselection Filtering & Sorting', () => {
  test('filters wells by radius from user location', async () => {
    sessionStorage.setItem("tabIndex", "0");
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation(success => success({
        coords: {
          latitude: 40.8202,
          longitude: -96.7005
        }
      }))
    };
    global.navigator.geolocation = mockGeolocation;

    const wellsWithinRadius = {
      Wells: [
        {
          well_id: 1,
          wi_wellcode: 'UNL001',
          wi_wellname: 'Near Wellselection',
          wi_estlatitude: 40.8302,
          wi_estlongitude: -96.7105,
        },
        {
          well_id: 2,
          wi_wellcode: 'UNL002',
          wi_wellname: 'Far Wellselection',
          wi_estlatitude: 41.8202,
          wi_estlongitude: -96.7005,
        }
      ]
    };

    localStorage.setItem('wellData', JSON.stringify(wellsWithinRadius));

    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: wellsWithinRadius });
      }
    });

    const { container } = renderWellWithContext();

    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });

    await waitFor(() => {
      const initialMarkers = document.querySelectorAll('img[src*="wellIcon.png"]');
      expect(initialMarkers.length).toBe(2);
    });

    const filteredWells = wellsWithinRadius.Wells.filter(well => {
      const R = 3959;
      const lat1 = 40.8202 * Math.PI / 180;
      const lat2 = well.wi_estlatitude * Math.PI / 180;
      const dLat = lat2 - lat1;
      const dLon = (well.wi_estlongitude - (-96.7005)) * Math.PI / 180;
      const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLon/2) ** 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= 1;
    });

    expect(filteredWells.length).toBe(1);
    expect(filteredWells[0].wi_wellcode).toBe('UNL001');
  });

  test('filters wells by search term', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url, config) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (config && config.params && config.params.filterBy && config.params.filterBy.search) {
          const term = config.params.filterBy.search.toLowerCase();
          const filteredData = {
            Wells: sampleWells.Wells.filter(well =>
              well.wi_wellname.toLowerCase().includes(term)
            )
          };
          return Promise.resolve({ data: filteredData });
        }
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    renderWellWithContext();
  
    await waitFor(() => {
      expect(screen.getByText(/Alpha Wellselection/i)).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText("List View"));
  
    await waitFor(() => {
      expect(screen.getByText("Filters")).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText("Filters"));
  
    const searchInput = screen.getByPlaceholderText("Search by well name");
    fireEvent.change(searchInput, { target: { value: "Alpha" } });
  
    await waitFor(() => {
      expect(screen.getByText(/Alpha Wellselection/i)).toBeInTheDocument();
      expect(screen.queryByText(/Beta Wellselection/i)).toBeNull();
      expect(screen.queryByText(/Charlie Wellselection/i)).toBeNull();
    });
  });

  test('filters wells by coordinate bounds', async () => {
    sessionStorage.setItem("tabIndex", "0");
    const wellsInBounds = {
      Wells: [
        {
          well_id: 1,
          wi_wellcode: 'UNL001',
          wi_wellname: 'In Bounds Wellselection',
          wi_estlatitude: 41.5,
          wi_estlongitude: -96.5,
        },
        {
          well_id: 2,
          wi_wellcode: 'UNL002',
          wi_wellname: 'Out of Bounds Wellselection',
          wi_estlatitude: 43.2,
          wi_estlongitude: -98.7,
        }
      ]
    };
  
    localStorage.setItem('wellData', JSON.stringify(wellsInBounds));
  
    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (url.includes('minLat=41') && url.includes('maxLat=42') && 
            url.includes('minLon=-97') && url.includes('maxLon=-96')) {
          const filteredData = {
            Wells: wellsInBounds.Wells.filter(well => 
              well.wi_estlatitude >= 41 && well.wi_estlatitude <= 42 &&
              well.wi_estlongitude >= -97 && well.wi_estlongitude <= -96
            )
          };
          return Promise.resolve({ data: filteredData });
        }
        return Promise.resolve({ data: wellsInBounds });
      }
    });
  
    const { container } = renderWellWithContext();
  
    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });
  
    await waitFor(() => {
      const initialMarkers = document.querySelectorAll('img[src*="wellIcon.png"]');
      expect(initialMarkers.length).toBe(2);
    });
  
    const filteredData = wellsInBounds.Wells.filter(well => 
      well.wi_estlatitude >= 41 && well.wi_estlatitude <= 42 &&
      well.wi_estlongitude >= -97 && well.wi_estlongitude <= -96
    );
  
    expect(filteredData.length).toBe(1);
    expect(filteredData[0].wi_wellcode).toBe('UNL001');
  });
  
  test('sorts well alphabetically by well name', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    const { container } = renderWellWithContext();
  
    await waitFor(() => {
      const tabList = container.querySelector('.react-tabs__tab-list');
      expect(tabList).toBeInTheDocument();
    });
  
    const listTab = container.querySelector('.react-tabs__tab-list li:nth-child(2)');
    expect(listTab).toBeDefined();
    fireEvent.click(listTab);
  
    await waitFor(() => {
      expect(screen.getByText("Sort")).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText("Sort"));
  
    await waitFor(() => {
      expect(screen.getByText(/Wellselection Name A-Z/i)).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText(/Wellselection Name A-Z/i));
  
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[1]).toHaveTextContent("Alpha Wellselection");
    });
  });
  
  test('sorts wells by oldest first', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    const { container } = renderWellWithContext();
  
    await waitFor(() => {
      const tabList = container.querySelector('.react-tabs__tab-list');
      expect(tabList).toBeInTheDocument();
    });
  
    await waitFor(() => {
      const tabs = container.querySelectorAll('.react-tabs__tab');
      expect(tabs.length).toBeGreaterThan(0);
    });
  
    const tabs = container.querySelectorAll('.react-tabs__tab');
    const listTab = Array.from(tabs).find(tab => /List View/i.test(tab.textContent));
    expect(listTab).toBeDefined();
    fireEvent.click(listTab);
  
    await waitFor(() => {
      expect(screen.getByText("Sort")).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText("Sort"));
  
    await waitFor(() => {
      expect(screen.getByText(/Oldest First/i)).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText(/Oldest First/i));
  
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[1]).toHaveTextContent("Alpha Wellselection");
    });
  });
  
  test('sorts wells by newest first', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url, config) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (config && config.params && config.params.sortBy === 'well_id DESC') {
          const sortedData = { Wells: [...sampleWells.Wells].sort((a, b) => b.well_id - a.well_id) };
          return Promise.resolve({ data: sortedData });
        }
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    const { container } = renderWellWithContext();
  
    await waitFor(() => {
      const tabList = container.querySelector('.react-tabs__tab-list');
      expect(tabList).toBeInTheDocument();
    });
  
    const tabs = container.querySelectorAll('.react-tabs__tab');
    const listTab = Array.from(tabs).find(tab => tab.textContent.trim() === 'List View');
    expect(listTab).toBeDefined();
    fireEvent.click(listTab);
  
    await waitFor(() => {
      expect(screen.getByText("Sort")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Sort"));
    
    await waitFor(() => {
      expect(screen.getByText(/Newest First/i)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/Newest First/i));
  
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[1]).toHaveTextContent("Charlie Wellselection");
    });
  });
  
  test('sorts wells by most recent field activity', async () => {
    sessionStorage.setItem("tabIndex", "0");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url, config) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        const sortedWells = {
          Wells: [...sampleWells.Wells].sort((a, b) => 
            new Date(b.fieldActivity.fa_datecollected) - new Date(a.fieldActivity.fa_datecollected)
          )
        };
        return Promise.resolve({ data: sortedWells });
      }
    });
  
    const { container } = renderWellWithContext();
  
    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });
  
    const tabs = container.querySelectorAll('.react-tabs__tab');
    const listTab = Array.from(tabs).find(tab => tab.textContent.trim() === 'List View');
    expect(listTab).toBeDefined();
    fireEvent.click(listTab);
  
    await waitFor(() => {
      expect(screen.getByText("Sort")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Sort"));
    await waitFor(() => {
      expect(screen.getByText(/Most Recent Field Entry/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Most Recent Field Entry/i));
    
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[1]).toHaveTextContent("Charlie Wellselection");
      expect(listItems[2]).toHaveTextContent("Beta Wellselection");
      expect(listItems[3]).toHaveTextContent("Alpha Wellselection");
    });
  });
  
  test('filters wells by county', async () => {
    sessionStorage.setItem("tabIndex", "0");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (url.includes('filterBy')) {
          const params = new URLSearchParams(url.split('?')[1]);
          const filterBy = JSON.parse(params.get('filterBy'));
          if (filterBy.county_id) {
            const filteredData = {
              Wells: sampleWells.Wells.filter(well => 
                well.county_id === parseInt(filterBy.county_id) || parseInt(filterBy.county_id) === -1
              )
            };
            return Promise.resolve({ data: filteredData });
          }
        }
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    const { container } = renderWellWithContext();
  
    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });
  
    const lancasterWells = sampleWells.Wells.filter(well => well.county_id === 1);
    expect(lancasterWells.length).toBe(2);
    expect(lancasterWells[0].wi_wellcode).toBe('UNL001');
  
    const douglasWells = sampleWells.Wells.filter(well => well.county_id === 2);
    expect(douglasWells.length).toBe(1);
    expect(douglasWells[0].wi_wellcode).toBe('UNL002');
  });
  
  test('filters wells by nrd', async () => {
    sessionStorage.setItem("tabIndex", "0");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (url.includes('filterBy')) {
          const params = new URLSearchParams(url.split('?')[1]);
          const filterBy = JSON.parse(params.get('filterBy'));
          if (filterBy.nrd_id) {
            const filteredData = {
              Wells: sampleWells.Wells.filter(well =>
                well.nrd_id === parseInt(filterBy.nrd_id) || parseInt(filterBy.nrd_id) === -1
              )
            };
            return Promise.resolve({ data: filteredData });
          }
        }
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    renderWellWithContext();
  
    await waitFor(() => {
      expect(document.getElementById('map-container')).toBeInTheDocument();
    });
  
    const wellsNrd100 = sampleWells.Wells.filter(well => well.nrd_id === 100);
    expect(wellsNrd100.length).toBe(2);
    const wellCodesNrd100 = wellsNrd100.map(well => well.wi_wellcode);
    expect(wellCodesNrd100).toContain('UNL001');
    expect(wellCodesNrd100).toContain('UNL003');
  
    const wellsNrd200 = sampleWells.Wells.filter(well => well.nrd_id === 200);
    expect(wellsNrd200.length).toBe(1);
    expect(wellsNrd200[0].wi_wellcode).toBe('UNL002');
  });
  
  test('applies combined filters (county, NRD, and search) correctly', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url, config) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (config && config.params && config.params.filterBy) {
          const { county_id, nrd_id, search } = config.params.filterBy;
          const filteredData = {
            Wells: sampleWells.Wells.filter(well => {
              const matchesCounty =
                county_id && parseInt(county_id) !== -1
                  ? well.county_id === parseInt(county_id)
                  : true;
              const matchesNRD =
                nrd_id && parseInt(nrd_id) !== -1
                  ? well.nrd_id === parseInt(nrd_id)
                  : true;
              const matchesSearch = search
                ? well.wi_wellname.toLowerCase().includes(search.toLowerCase())
                : true;
              return matchesCounty && matchesNRD && matchesSearch;
            }),
          };
          return Promise.resolve({ data: filteredData });
        }
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    await act(async () => {
      renderWellWithContext();
    });
  
    await act(async () => {
      fireEvent.click(screen.getByText("List View"));
    });
  
    await waitFor(() => expect(screen.getByText("Filters")).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByText("Filters"));
    });
  
    const countySelect = screen.getByText("County:").nextSibling;
    await act(async () => {
      fireEvent.change(countySelect, { target: { value: "1" } });
    });
  
    const nrdSelect = screen.getByText("Natural Resource District:").nextSibling;
    await act(async () => {
      fireEvent.change(nrdSelect, { target: { value: "100" } });
    });
  
    const searchInput = screen.getByPlaceholderText("Search by well name");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Alpha" } });
    });
  
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(2);
      expect(listItems[1]).toHaveTextContent("Alpha Wellselection");
      expect(screen.queryByText(/Beta Wellselection/i)).toBeNull();
      expect(screen.queryByText(/Charlie Wellselection/i)).toBeNull();
    });
  });
  
  test('clears filters when Clear Filters button is clicked', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url, config) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (config && config.params && config.params.filterBy && config.params.filterBy.search) {
          const term = config.params.filterBy.search.toLowerCase();
          const filteredData = {
            Wells: sampleWells.Wells.filter(well =>
              well.wi_wellname.toLowerCase().includes(term)
            ),
          };
          return Promise.resolve({ data: filteredData });
        }
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    await act(async () => {
      renderWellWithContext();
    });
  
    await act(async () => {
      fireEvent.click(screen.getByText("List View"));
    });
    await waitFor(() => expect(screen.getByText("Filters")).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByText("Filters"));
    });
  
    const searchInput = screen.getByPlaceholderText("Search by well name");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Alpha" } });
    });
  
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(2);
    });
  
    await act(async () => {
      fireEvent.click(screen.getByText("Clear Filters"));
    });
  
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(sampleWells.Wells.length + 1);
      expect(screen.getByText(/Alpha Wellselection/i)).toBeInTheDocument();
      expect(screen.getByText(/Beta Wellselection/i)).toBeInTheDocument();
      expect(screen.getByText(/Charlie Wellselection/i)).toBeInTheDocument();
    });
  });
  
  test('displays no wells when filters yield no matches', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url, config) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (config && config.params && config.params.filterBy && config.params.filterBy.search) {
          const term = config.params.filterBy.search.toLowerCase();
          const filteredData = {
            Wells: sampleWells.Wells.filter(well =>
              well.wi_wellname.toLowerCase().includes(term)
            )
          };
          return Promise.resolve({ data: filteredData });
        }
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    await act(async () => {
      renderWellWithContext();
    });
  
    await act(async () => {
      fireEvent.click(screen.getByText("List View"));
    });
  
    await waitFor(() => {
      expect(screen.getByText("Filters")).toBeInTheDocument();
    });
  
    await act(async () => {
      fireEvent.click(screen.getByText("Filters"));
    });
  
    const searchInput = screen.getByPlaceholderText("Search by well name");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Nonexistent" } });
    });
  
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(1);
    });
  });
  
  test('sanitizes search input to remove quotes and punctuation', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));
  
    Axios.get.mockImplementation((url, config) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (config && config.params && config.params.filterBy && config.params.filterBy.search) {
          const term = config.params.filterBy.search.toLowerCase();
          const filteredData = {
            Wells: sampleWells.Wells.filter(well =>
              well.wi_wellname.toLowerCase().includes(term)
            )
          };
          return Promise.resolve({ data: filteredData });
        }
        return Promise.resolve({ data: sampleWells });
      }
    });
  
    renderWellWithContext();
  
    await waitFor(() => expect(screen.getByText(/Alpha Wellselection/i)).toBeInTheDocument());
  
    fireEvent.click(screen.getByText("List View"));
  
    await waitFor(() => expect(screen.getByText("Filters")).toBeInTheDocument());
  
    fireEvent.click(screen.getByText("Filters"));
  
    const searchInput = screen.getByPlaceholderText("Search by well name");
  
    fireEvent.change(searchInput, { target: { value: 'Alpha"\'!@#$%^&*()' } });
    
    await waitFor(() => {
      expect(searchInput.value).toBe("Alpha");
    });
  
    await waitFor(() => {
      expect(screen.getByText(/Alpha Wellselection/i)).toBeInTheDocument();
      expect(screen.queryByText(/Beta Wellselection/i)).toBeNull();
      expect(screen.queryByText(/Charlie Wellselection/i)).toBeNull();
    });
  });

  test('shows filter indicator in list view when any filter criteria is entered', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));

    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });

    renderWellWithContext();

    await waitFor(() => {
      const listViewTab = screen.getByText('List View');
      fireEvent.click(listViewTab);
    });

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    const countySelect = screen.getByText("County:").nextSibling;
    await act(async () => {
      fireEvent.change(countySelect, { target: { value: "1" } });
    });

    const indicator = filterButton.querySelector('span');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle({
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      width: '13px',
      height: '13px',
      background: 'red',
      borderRadius: '60%'
    });
  });

  test('filter indicator correctly tracks filter state changes', async () => {
    localStorage.setItem('wellData', JSON.stringify(sampleWells));

    Axios.get.mockImplementation((url) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        return Promise.resolve({ data: sampleWells });
      }
    });

    renderWellWithContext();

    await waitFor(() => {
      const listViewTab = screen.getByText('List View');
      fireEvent.click(listViewTab);
    });

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    let indicator = filterButton.querySelector('span');
    expect(indicator).toBeDefined();

    const searchInput = screen.getByPlaceholderText("Search by well name");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Alpha" } });
    });

    indicator = filterButton.querySelector('span');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle({
      background: 'red'
    });

    const clearButton = screen.getByText('Clear Filters');
    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      indicator = filterButton.querySelector('span');
      expect(indicator).not.toBeInTheDocument();
    });
  });

  test('sorts well alphabetically by well name and highlights selected option in list view', async () => {
    sessionStorage.setItem("tabIndex", "1");
    localStorage.setItem('wellData', JSON.stringify(sampleWells));

    Axios.get.mockImplementation((url, config) => {
      if (url === '/userinfo') {
        return Promise.resolve({ data: { displayn: 'testuser' } });
      } else if (url === '/Wells') {
        if (config?.params?.sortBy === 'wi_wellname') {
          const sortedData = {
            Wells: [...sampleWells.Wells].sort((a, b) => 
              a.wi_wellname.localeCompare(b.wi_wellname)
            )
          };
          return Promise.resolve({ data: sortedData });
        }
        return Promise.resolve({ data: sampleWells });
      }
    });

    renderWellWithContext();

    await waitFor(() => {
      expect(screen.getByText("Sort")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Sort"));

    await waitFor(() => {
      expect(screen.getByText(/Wellselection Name A-Z/i)).toBeInTheDocument();
    });
    const sortOption = screen.getByText(/Wellselection Name A-Z/i);
    fireEvent.click(sortOption);

    expect(sortOption).toHaveStyle({ backgroundColor: 'lightblue' });

    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[1]).toHaveTextContent("Alpha Wellselection");
      expect(listItems[2]).toHaveTextContent("Beta Wellselection");
      expect(listItems[3]).toHaveTextContent("Charlie Wellselection");
    });

    const newSortOption = screen.getByText(/Newest First/i);
    fireEvent.click(newSortOption);

    expect(sortOption).not.toHaveStyle({ backgroundColor: 'lightblue' });
    expect(newSortOption).toHaveStyle({ backgroundColor: 'lightblue' });
  });


});
