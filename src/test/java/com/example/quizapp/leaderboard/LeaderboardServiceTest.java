package com.example.quizapp.leaderboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import com.example.quizapp.user.User;
import com.example.quizapp.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

	@Mock
	private StringRedisTemplate redisTemplate;

	@Mock
	private UserRepository userRepository;

	@Mock
	private ZSetOperations<String, String> zSetOps;

	@Test
	@DisplayName("Degrades to no-op when Redis is not configured")
	void degradesWhenNotConfigured() {
		LeaderboardService service = new LeaderboardService(redisTemplate, userRepository, "");

		service.recordSubmission(1L, 2L, 3L, 10, 80.0);

		assertThat(service.topGlobal(10)).isEmpty();
		verifyNoInteractions(redisTemplate);
	}

	@Test
	@DisplayName("Returns empty list instead of failing when Redis errors")
	void returnsEmptyOnRedisFailure() {
		when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
		when(zSetOps.reverseRangeWithScores(anyString(), org.mockito.ArgumentMatchers.anyLong(),
				org.mockito.ArgumentMatchers.anyLong()))
				.thenThrow(new RuntimeException("connection refused"));

		LeaderboardService service = new LeaderboardService(redisTemplate, userRepository,
				"rediss://default:pw@example.upstash.io:6379");

		assertThat(service.topGlobal(10)).isEmpty();
	}

	@SuppressWarnings("unchecked")
	private ZSetOperations.TypedTuple<String> tuple(String member, Double score) {
		ZSetOperations.TypedTuple<String> t =
				org.mockito.Mockito.mock(ZSetOperations.TypedTuple.class);
		org.mockito.Mockito.when(t.getValue()).thenReturn(member);
		org.mockito.Mockito.when(t.getScore()).thenReturn(score);
		return t;
	}

	@Test
	@DisplayName("Maps redis tuples to ranked entries with user names")
	void mapsTuplesToEntries() {
		ZSetOperations.TypedTuple<String> tuple1 = tuple("7", 250.5);
		ZSetOperations.TypedTuple<String> tuple2 = tuple("3", 90.0);
		when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
		java.util.Set<ZSetOperations.TypedTuple<String>> tuples = new java.util.LinkedHashSet<>();
		tuples.add(tuple1);
		tuples.add(tuple2);
		when(zSetOps.reverseRangeWithScores(anyString(), org.mockito.ArgumentMatchers.anyLong(),
				org.mockito.ArgumentMatchers.anyLong())).thenReturn(tuples);
		User u7 = User.builder().id(7L).name("Ada").build();
		User u3 = User.builder().id(3L).name("Lin").build();
		when(userRepository.findAllByIdIn(List.of(7L, 3L))).thenReturn(List.of(u7, u3));

		LeaderboardService service = new LeaderboardService(redisTemplate, userRepository,
				"rediss://default:pw@example.upstash.io:6379");

		List<LeaderboardEntryDto> entries = service.topGlobal(10);

		assertThat(entries).containsExactly(
				new LeaderboardEntryDto(1, 7L, "Ada", 250.5),
				new LeaderboardEntryDto(2, 3L, "Lin", 90.0));
	}
}
