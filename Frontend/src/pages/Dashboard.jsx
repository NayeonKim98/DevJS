import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../assets/Dashboard.css";
import Header from "../components/Header";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      console.warn("⛔ access_token이 없습니다.");
      return;
    }

    // 자소서 목록 불러오기
    axios.get("http://localhost:8000/api/total/total_list/", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => setJobs(res.data))
      .catch(err => console.error("자소서 목록 가져오기 실패:", err));

    // 사용자 정보 불러오기
    axios.get("http://localhost:8000/api/auth/user/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })
      .then((res) => setUser(res.data))
      .catch(async (err) => {
        const errorCode = err.response?.data?.code;

        if (errorCode === "token_not_valid") {
          console.warn("🔄 access_token 만료 → refresh 시도");

          const refreshToken = localStorage.getItem("refresh_token");

          try {
            const res = await axios.post("http://localhost:8000/api/token/refresh/", {
              refresh: refreshToken,
            });

            const newAccessToken = res.data.access;
            localStorage.setItem("access_token", newAccessToken);

            const retry = await axios.get("http://localhost:8000/api/auth/user/", {
              headers: { Authorization: `Bearer ${newAccessToken}` }
            });

            setUser(retry.data);
          } catch (refreshError) {
            console.error("⛔ refresh_token도 만료됨 → 로그아웃 처리");
            alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
            localStorage.clear();
            window.location.href = "/";
          }
        } else {
          console.error("⛔ 유저 정보 요청 실패:", err.response?.data || err);
        }
      });
  }, []);

  const visibleJobs = showMore ? jobs : jobs.slice(0, 3);

  const sortedJobs = [...visibleJobs].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (sortConfig.key === 'deadline') {
      return sortConfig.direction === 'asc'
        ? new Date(aVal) - new Date(bVal)
        : new Date(bVal) - new Date(aVal);
    }

    return sortConfig.direction === 'asc'
      ? aVal.localeCompare(bVal, 'ko')
      : bVal.localeCompare(aVal, 'ko');
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const handleCreateClick = () => {
    navigate("/totalupload");
  };

  const handleSeeMore = () => setShowMore(true);

  if (!user) return <p className="loading">유저 정보를 불러오는 중입니다...</p>;

  return (
    <div className="dashboard-container">
      <Header />

      <h1 className="greeting">안녕하세요, {user.nickname}님</h1>
      <p className="welcome">개발자를 위한 자기소개서 첨삭 서비스 DevJS에 오신 것을 환영합니다.</p>
      <button className="create-button" onClick={handleCreateClick}>+ 새로 만들기</button>

      {jobs.length === 0 ? (
        <div className="no-jobs">
          <p>📝 아직 등록된 자소서가 없습니다.</p>
          <p>+ 새로 만들기를 눌러 자소서를 등록해보세요!</p>
        </div>
      ) : (
        <>
          <table className="job-table">
            <thead>
              <tr>
                <th>기업</th>
                <th onClick={() => handleSort('deadline')} style={{ cursor: 'pointer' }}>
                  마감일 {getSortIndicator('deadline')}
                </th>
                {/* 추후 추가 예정 ( 상태 ) */}
                {/* <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  상태 {getSortIndicator('status')}
                </th> */}  
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map((job, index) => (
                <tr key={index}>
                  <td
                    onClick={() => navigate(`/coverletter/${job.id}`)}
                    style={{ cursor: "pointer", fontWeight: "bold", color: "#4f46e5" }}
                  >
                    {job.company_name}
                  </td>
                  <td>{job.deadline}</td>
                  <td>
                    <span className={`status ${job.status === '수정 중' ? 'editing' : 'submitted'}`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!showMore && (
            <div className="see-more" onClick={handleSeeMore}>
              더보기
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
