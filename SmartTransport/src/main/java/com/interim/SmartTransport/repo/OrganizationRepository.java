package com.interim.SmartTransport.repo;

import com.interim.SmartTransport.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    Optional<Organization> findByEmailDomain(String emailDomain);

    boolean existsByEmailDomainAndWhitelistedTrue(String emailDomain);
}

