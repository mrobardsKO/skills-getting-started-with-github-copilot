from urllib.parse import quote

from src.app import activities


def test_get_activities_returns_activity_mapping(client):
    endpoint = "/activities"

    response = client.get(endpoint)

    body = response.json()
    assert response.status_code == 200
    assert isinstance(body, dict)
    assert "Chess Club" in body
    assert "participants" in body["Chess Club"]


def test_signup_adds_participant_to_activity(client):
    activity_name = "Chess Club"
    email = "new.student@mergington.edu"
    endpoint = f"/activities/{quote(activity_name, safe='')}/signup"

    response = client.post(endpoint, params={"email": email})

    body = response.json()
    assert response.status_code == 200
    assert "message" in body
    assert email in activities[activity_name]["participants"]


def test_signup_unknown_activity_returns_not_found(client):
    activity_name = "Unknown Club"
    email = "student@mergington.edu"
    endpoint = f"/activities/{quote(activity_name, safe='')}/signup"

    response = client.post(endpoint, params={"email": email})

    body = response.json()
    assert response.status_code == 404
    assert "detail" in body


def test_signup_duplicate_returns_bad_request(client):
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    endpoint = f"/activities/{quote(activity_name, safe='')}/signup"

    response = client.post(endpoint, params={"email": email})

    body = response.json()
    assert response.status_code == 400
    assert "detail" in body


def test_signup_normalizes_email_case(client):
    activity_name = "Chess Club"
    email_upper = "New.Student@Mergington.EDU"
    email_normalized = email_upper.strip().lower()
    endpoint = f"/activities/{quote(activity_name, safe='')}/signup"

    response = client.post(endpoint, params={"email": email_upper})

    body = response.json()
    assert response.status_code == 200
    assert email_normalized in activities[activity_name]["participants"]


def test_signup_duplicate_case_insensitive_returns_bad_request(client):
    activity_name = "Chess Club"
    email_upper = "Michael@Mergington.EDU"
    endpoint = f"/activities/{quote(activity_name, safe='')}/signup"

    response = client.post(endpoint, params={"email": email_upper})

    body = response.json()
    assert response.status_code == 400
    assert "detail" in body


def test_unregister_normalizes_email_case(client):
    activity_name = "Chess Club"
    email_upper = "Michael@Mergington.EDU"
    endpoint = (
        f"/activities/{quote(activity_name, safe='')}/participants/{quote(email_upper, safe='')}"
    )

    response = client.delete(endpoint)

    body = response.json()
    assert response.status_code == 200
    assert "michael@mergington.edu" not in activities[activity_name]["participants"]


def test_unregister_removes_participant(client):
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    endpoint = (
        f"/activities/{quote(activity_name, safe='')}/participants/{quote(email, safe='')}"
    )

    response = client.delete(endpoint)

    body = response.json()
    assert response.status_code == 200
    assert "message" in body
    assert email not in activities[activity_name]["participants"]


def test_unregister_unknown_activity_returns_not_found(client):
    activity_name = "Unknown Club"
    email = "student@mergington.edu"
    endpoint = (
        f"/activities/{quote(activity_name, safe='')}/participants/{quote(email, safe='')}"
    )

    response = client.delete(endpoint)

    body = response.json()
    assert response.status_code == 404
    assert "detail" in body


def test_unregister_non_participant_returns_not_found(client):
    activity_name = "Chess Club"
    email = "not.registered@mergington.edu"
    endpoint = (
        f"/activities/{quote(activity_name, safe='')}/participants/{quote(email, safe='')}"
    )

    response = client.delete(endpoint)

    body = response.json()
    assert response.status_code == 404
    assert "detail" in body